import { createAdminClient } from '@/lib/supabase/client'

export interface WalkthroughProgress {
  id: string
  user_id: string
  walkthrough_id: string
  current_step: number
  total_steps: number
  completed: boolean
  skipped: boolean
  started_at: string
  completed_at?: string
  skipped_at?: string
  last_accessed_at: string
  metadata?: Record<string, unknown>
}

export interface WalkthroughAnalytics {
  walkthrough_id: string
  total_starts: number
  total_completions: number
  total_skips: number
  completion_rate: number
  average_duration: number
  common_drop_off_step: number
  user_feedback?: {
    rating: number
    comment: string
  }[]
}

export class WalkthroughService {
  private static readonly TABLE_NAME = 'walkthrough_progress'

  /**
   * Start a walkthrough for a user
   */
  static async startWalkthrough(
    userId: string,
    walkthroughId: string,
    totalSteps: number
  ): Promise<WalkthroughProgress> {
    const supabase = createAdminClient()
    
    const progressData = {
      user_id: userId,
      walkthrough_id: walkthroughId,
      current_step: 0,
      total_steps: totalSteps,
      completed: false,
      skipped: false,
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: {
        started_from: 'manual',
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
      }
    }

    const { data, error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .insert(progressData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to start walkthrough: ${error.message}`)
    }

    return data
  }

  /**
   * Update walkthrough progress
   */
  static async updateProgress(
    userId: string,
    walkthroughId: string,
    currentStep: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = createAdminClient()

    const updateData: {
      current_step: number
      last_accessed_at: string
      metadata?: Record<string, unknown>
    } = {
      current_step: currentStep,
      last_accessed_at: new Date().toISOString()
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    const { error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('user_id', userId)
      .eq('walkthrough_id', walkthroughId)

    if (error) {
      throw new Error(`Failed to update progress: ${error.message}`)
    }
  }

  /**
   * Complete a walkthrough
   */
  static async completeWalkthrough(
    userId: string,
    walkthroughId: string,
    feedback?: {
      rating: number
      comment?: string
    }
  ): Promise<void> {
    const supabase = createAdminClient()

    const updateData = {
      completed: true,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: {
        completed_from: 'manual',
        feedback: feedback || null
      }
    }

    const { error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('user_id', userId)
      .eq('walkthrough_id', walkthroughId)

    if (error) {
      throw new Error(`Failed to complete walkthrough: ${error.message}`)
    }
  }

  /**
   * Skip a walkthrough
   */
  static async skipWalkthrough(
    userId: string,
    walkthroughId: string,
    reason?: string
  ): Promise<void> {
    const supabase = createAdminClient()

    const updateData = {
      skipped: true,
      skipped_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: {
        skip_reason: reason || 'user_choice'
      }
    }

    const { error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('user_id', userId)
      .eq('walkthrough_id', walkthroughId)

    if (error) {
      throw new Error(`Failed to skip walkthrough: ${error.message}`)
    }
  }

  /**
   * Get user's walkthrough progress
   */
  static async getUserProgress(userId: string): Promise<WalkthroughProgress[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user progress: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get specific walkthrough progress
   */
  static async getWalkthroughProgress(
    userId: string,
    walkthroughId: string
  ): Promise<WalkthroughProgress | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('walkthrough_id', walkthroughId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No progress found
      }
      throw new Error(`Failed to fetch walkthrough progress: ${error.message}`)
    }

    return data
  }

  /**
   * Get completed walkthroughs for a user
   */
  static async getCompletedWalkthroughs(userId: string): Promise<string[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('walkthrough_id')
      .eq('user_id', userId)
      .eq('completed', true)

    if (error) {
      throw new Error(`Failed to fetch completed walkthroughs: ${error.message}`)
    }

    return (data as any[]).map(item => item.walkthrough_id)
  }

  /**
   * Get skipped walkthroughs for a user
   */
  static async getSkippedWalkthroughs(userId: string): Promise<string[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('walkthrough_id')
      .eq('user_id', userId)
      .eq('skipped', true)

    if (error) {
      throw new Error(`Failed to fetch skipped walkthroughs: ${error.message}`)
    }

    return (data as any[]).map(item => item.walkthrough_id)
  }

  /**
   * Resume a walkthrough from where the user left off
   */
  static async resumeWalkthrough(
    userId: string,
    walkthroughId: string
  ): Promise<WalkthroughProgress | null> {
    const progress = await this.getWalkthroughProgress(userId, walkthroughId)
    
    if (!progress || progress.completed || progress.skipped) {
      return null
    }

    // Update last accessed time
    await this.updateProgress(userId, walkthroughId, progress.current_step)
    
    return progress
  }

  /**
   * Get walkthrough analytics for admins
   */
  static async getWalkthroughAnalytics(
    walkthroughId?: string
  ): Promise<WalkthroughAnalytics[]> {
    const supabase = createAdminClient()

    let query = supabase
      .from(this.TABLE_NAME)
      .select('*')

    if (walkthroughId) {
      query = query.eq('walkthrough_id', walkthroughId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`)
    }

    // Process analytics data
    const analyticsMap: Record<string, WalkthroughAnalytics> = {}

    ;(data as any[]).forEach((progress: any) => {
      const id = progress.walkthrough_id as string
      
      if (!analyticsMap[id]) {
        analyticsMap[id] = {
          walkthrough_id: id,
          total_starts: 0,
          total_completions: 0,
          total_skips: 0,
          completion_rate: 0,
          average_duration: 0,
          common_drop_off_step: 0,
          user_feedback: []
        }
      }

      const analytics = analyticsMap[id]
      analytics.total_starts++

      if (progress.completed) {
        analytics.total_completions++
        
        // Calculate duration
        const duration = new Date(progress.completed_at!).getTime() - 
                        new Date(progress.started_at).getTime()
        analytics.average_duration = 
          (analytics.average_duration * (analytics.total_completions - 1) + duration) / 
          analytics.total_completions

        // Collect feedback
        if (progress.metadata?.feedback) {
          analytics.user_feedback!.push(progress.metadata.feedback)
        }
      }

      if (progress.skipped) {
        analytics.total_skips++
      }
    })

    // Calculate completion rates and drop-off points
    Object.values(analyticsMap).forEach((analytics: WalkthroughAnalytics) => {
      analytics.completion_rate = analytics.total_starts > 0 
        ? (analytics.total_completions / analytics.total_starts) * 100 
        : 0
    })

    return Object.values(analyticsMap)
  }

  /**
   * Reset walkthrough progress for a user
   */
  static async resetWalkthroughProgress(
    userId: string,
    walkthroughId?: string
  ): Promise<void> {
    const supabase = createAdminClient()

    let query = supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('user_id', userId)

    if (walkthroughId) {
      query = query.eq('walkthrough_id', walkthroughId)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to reset progress: ${error.message}`)
    }
  }

  /**
   * Get walkthrough recommendations for a user
   */
  static async getRecommendedWalkthroughs(
    userId: string,
    role: 'admin' | 'client'
  ): Promise<string[]> {
    const completed = await this.getCompletedWalkthroughs(userId)
    const skipped = await this.getSkippedWalkthroughs(userId)

    // Define walkthrough dependencies and recommendations
    const recommendations: Record<string, string[]> = {
      'client-dashboard-intro': ['client-jobs-overview', 'client-quotes-workflow'],
      'client-jobs-overview': ['client-documents-overview'],
      'admin-dashboard-intro': ['admin-user-management', 'admin-system-monitoring']
    }

    const roleWalkthroughs = {
      client: [
        'client-dashboard-intro',
        'client-jobs-overview', 
        'client-quotes-workflow',
        'client-documents-overview',
        'client-emergency-features'
      ],
      admin: [
        'admin-dashboard-intro',
        'admin-user-management',
        'admin-system-monitoring',
        'admin-analytics-overview'
      ]
    }

    const availableWalkthroughs = roleWalkthroughs[role]
    const recommended: string[] = []

    // Find walkthroughs that are available and not completed/skipped
    availableWalkthroughs.forEach(walkthroughId => {
      if (!completed.includes(walkthroughId) && !skipped.includes(walkthroughId)) {
        // Check if prerequisites are met
        const prereqs = recommendations[walkthroughId] || []
        const prereqsMet = prereqs.every(prereq => completed.includes(prereq))
        
        if (prereqsMet) {
          recommended.push(walkthroughId)
        }
      }
    })

    return recommended
  }

  /**
   * Track walkthrough interaction events
   */
  static async trackInteraction(
    userId: string,
    walkthroughId: string,
    event: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const supabase = createAdminClient()

    const interactionData = {
      user_id: userId,
      walkthrough_id: walkthroughId,
      event_type: event,
      event_data: data || {},
      timestamp: new Date().toISOString()
    }

    const { error } = await (supabase as any)
      .from('walkthrough_interactions')
      .insert(interactionData)

    if (error) {
      console.warn(`Failed to track interaction: ${error.message}`)
    }
  }
}
