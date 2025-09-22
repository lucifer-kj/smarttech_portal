'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { 
  HelpCircle, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface TooltipConfig {
  id: string
  title: string
  content: string | ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  type?: 'info' | 'warning' | 'success' | 'help'
  delay?: number
  maxWidth?: number
  showArrow?: boolean
  interactive?: boolean
  persistent?: boolean
  onShow?: () => void
  onHide?: () => void
}

interface ContextualTooltipProps {
  config: TooltipConfig
  children: ReactNode
  isVisible?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

const tooltipPositions = {
  top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
}

const tooltipTypes = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  help: {
    icon: HelpCircle,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    iconColor: 'text-purple-600'
  }
}

export function ContextualTooltip({
  config,
  children,
  isVisible = false,
  onVisibilityChange
}: ContextualTooltipProps) {
  const [visible, setVisible] = useState(isVisible)
  const [position, setPosition] = useState(config.position || 'top')
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const typeConfig = tooltipTypes[config.type || 'info']
  const Icon = typeConfig.icon

  useEffect(() => {
    if (isVisible !== visible) {
      setVisible(isVisible)
    }
  }, [isVisible])

  useEffect(() => {
    if (visible && config.onShow) {
      config.onShow()
    } else if (!visible && config.onHide) {
      config.onHide()
    }
    onVisibilityChange?.(visible)
  }, [visible, config, onVisibilityChange])

  useEffect(() => {
    if (visible && tooltipRef.current && triggerRef.current) {
      calculatePosition()
    }
  }, [visible])

  const calculatePosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return

    const tooltip = tooltipRef.current
    const trigger = triggerRef.current
    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let newPosition = position

    // Auto-positioning logic
    if (position === 'auto') {
      const spaceTop = rect.top
      const spaceBottom = viewport.height - rect.bottom
      const spaceLeft = rect.left
      const spaceRight = viewport.width - rect.right

      if (spaceBottom >= tooltipRect.height + 10) {
        newPosition = 'bottom'
      } else if (spaceTop >= tooltipRect.height + 10) {
        newPosition = 'top'
      } else if (spaceRight >= tooltipRect.width + 10) {
        newPosition = 'right'
      } else if (spaceLeft >= tooltipRect.width + 10) {
        newPosition = 'left'
      } else {
        newPosition = 'bottom' // fallback
      }
    }

    setActualPosition(newPosition)
  }

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (config.delay) {
      timeoutRef.current = setTimeout(() => {
        setVisible(true)
      }, config.delay)
    } else {
      setVisible(true)
    }
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setVisible(false)
  }

  const handleMouseEnter = () => {
    if (config.trigger === 'hover' || !config.trigger) {
      showTooltip()
    }
  }

  const handleMouseLeave = () => {
    if (config.trigger === 'hover' || !config.trigger) {
      hideTooltip()
    }
  }

  const handleClick = () => {
    if (config.trigger === 'click') {
      setVisible(!visible)
    }
  }

  const handleFocus = () => {
    if (config.trigger === 'focus') {
      showTooltip()
    }
  }

  const handleBlur = () => {
    if (config.trigger === 'focus') {
      hideTooltip()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && visible) {
      hideTooltip()
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="inline-block"
      >
        {children}
      </div>

      {visible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${tooltipPositions[actualPosition as keyof typeof tooltipPositions]}`}
          style={{ maxWidth: config.maxWidth || 300 }}
        >
          <Card className={`p-3 ${typeConfig.bgColor} ${typeConfig.borderColor} border`}>
            <div className="flex items-start space-x-2">
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${typeConfig.iconColor}`} />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${typeConfig.textColor} mb-1`}>
                  {config.title}
                </h4>
                <div className={`text-sm ${typeConfig.textColor}`}>
                  {typeof config.content === 'string' ? (
                    <p>{config.content}</p>
                  ) : (
                    config.content
                  )}
                </div>
              </div>
              {config.interactive && (
                <button
                  onClick={hideTooltip}
                  className={`ml-2 ${typeConfig.textColor} hover:opacity-70`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {config.showArrow && (
              <div className={`absolute w-2 h-2 transform rotate-45 ${
                actualPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                actualPosition === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
                actualPosition === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
                'right-full top-1/2 -translate-y-1/2 -mr-1'
              } ${typeConfig.bgColor} border-r border-b ${
                actualPosition === 'top' ? 'border-blue-200' :
                actualPosition === 'bottom' ? 'border-blue-200' :
                actualPosition === 'left' ? 'border-blue-200' :
                'border-blue-200'
              }`} />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

// Guided Tour Component
export interface TourStep {
  id: string
  target: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: {
    type: 'click' | 'scroll' | 'wait'
    target?: string
    delay?: number
  }
}

export interface GuidedTourProps {
  steps: TourStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function GuidedTour({
  steps,
  isActive,
  onComplete,
  onSkip,
  currentStep = 0,
  onStepChange
}: GuidedTourProps) {
  const [step, setStep] = useState(currentStep)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  useEffect(() => {
    if (onStepChange) {
      onStepChange(step)
    }
  }, [step, onStepChange])

  useEffect(() => {
    if (isActive && currentStepData) {
      highlightElement(currentStepData.target)
    }
    return () => clearHighlight()
  }, [isActive, currentStepData])

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const clearHighlight = () => {
    setHighlightedElement(null)
  }

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const skipTour = () => {
    onSkip()
  }

  if (!isActive || !currentStepData) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight */}
      {highlightedElement && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute border-2 border-blue-500 rounded-lg shadow-lg bg-blue-500/10 pointer-events-auto"
            style={{
              top: highlightedElement.offsetTop - 8,
              left: highlightedElement.offsetLeft - 8,
              width: highlightedElement.offsetWidth + 16,
              height: highlightedElement.offsetHeight + 16,
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <Card className="max-w-md mx-4 bg-white shadow-xl">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentStepData.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Step {step + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={skipTour}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              {currentStepData.content}
            </p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {step === steps.length - 1 ? (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onComplete}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete Tour
                </Button>
              ) : (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={nextStep}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Tooltip Manager Hook
export function useTooltipManager() {
  const [tooltips, setTooltips] = useState<Map<string, boolean>>(new Map())

  const showTooltip = (id: string) => {
    setTooltips(prev => new Map(prev.set(id, true)))
  }

  const hideTooltip = (id: string) => {
    setTooltips(prev => new Map(prev.set(id, false)))
  }

  const toggleTooltip = (id: string) => {
    setTooltips(prev => new Map(prev.set(id, !prev.get(id))))
  }

  const isTooltipVisible = (id: string) => {
    return tooltips.get(id) || false
  }

  const hideAllTooltips = () => {
    setTooltips(new Map())
  }

  return {
    showTooltip,
    hideTooltip,
    toggleTooltip,
    isTooltipVisible,
    hideAllTooltips
  }
}
