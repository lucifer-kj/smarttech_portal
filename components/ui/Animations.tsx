'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { useReducedMotion } from './Accessibility'

// Animation Hook
export function useAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [hasAnimated, prefersReducedMotion])

  return { elementRef, isVisible, hasAnimated }
}

// Fade In Animation
interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  direction = 'up',
  className = '' 
}: FadeInProps) {
  const { elementRef, isVisible } = useAnimation()
  const prefersReducedMotion = useReducedMotion()

  const getTransform = () => {
    if (prefersReducedMotion) return 'translateY(0)'
    
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)',
      none: 'translateY(0)'
    }
    
    return transforms[direction]
  }

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : getTransform(),
    transition: prefersReducedMotion 
      ? 'none' 
      : `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
    transitionDelay: `${delay}ms`
  }

  return (
    <div ref={elementRef} style={style} className={className}>
      {children}
    </div>
  )
}

// Slide In Animation
interface SlideInProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction = 'left', 
  delay = 0, 
  duration = 600,
  className = '' 
}: SlideInProps) {
  const { elementRef, isVisible } = useAnimation()
  const prefersReducedMotion = useReducedMotion()

  const getTransform = () => {
    if (prefersReducedMotion) return 'translateX(0)'
    
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    }
    
    return transforms[direction]
  }

  const style = {
    transform: isVisible ? 'translateX(0)' : getTransform(),
    transition: prefersReducedMotion 
      ? 'none' 
      : `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    transitionDelay: `${delay}ms`
  }

  return (
    <div ref={elementRef} style={style} className={className}>
      {children}
    </div>
  )
}

// Scale Animation
interface ScaleProps {
  children: ReactNode
  scale?: number
  delay?: number
  duration?: number
  className?: string
}

export function Scale({ 
  children, 
  scale = 0.8, 
  delay = 0, 
  duration = 400,
  className = '' 
}: ScaleProps) {
  const { elementRef, isVisible } = useAnimation()
  const prefersReducedMotion = useReducedMotion()

  const style = {
    transform: isVisible ? 'scale(1)' : `scale(${scale})`,
    opacity: isVisible ? 1 : 0,
    transition: prefersReducedMotion 
      ? 'none' 
      : `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
    transitionDelay: `${delay}ms`
  }

  return (
    <div ref={elementRef} style={style} className={className}>
      {children}
    </div>
  )
}

// Stagger Animation for Lists
interface StaggerProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}

export function Stagger({ 
  children, 
  staggerDelay = 100,
  className = '' 
}: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

// Hover Animation Component
interface HoverAnimationProps {
  children: ReactNode
  scale?: number
  rotate?: number
  duration?: number
  className?: string
}

export function HoverAnimation({ 
  children, 
  scale = 1.05, 
  rotate = 0,
  duration = 200,
  className = '' 
}: HoverAnimationProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`transition-transform duration-${duration} hover:scale-${Math.round(scale * 100)} hover:rotate-${rotate} ${className}`}
      style={{
        transition: `transform ${duration}ms ease-out`
      }}
    >
      {children}
    </div>
  )
}

// Pulse Animation
interface PulseProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function Pulse({ 
  children, 
  duration = 1000,
  className = '' 
}: PulseProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`animate-pulse ${className}`}
      style={{
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Bounce Animation
interface BounceProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function Bounce({ 
  children, 
  delay = 0,
  className = '' 
}: BounceProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`animate-bounce ${className}`}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

// Shake Animation
interface ShakeProps {
  children: ReactNode
  trigger?: boolean
  className?: string
}

export function Shake({ 
  children, 
  trigger = false,
  className = '' 
}: ShakeProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`${trigger ? 'animate-shake' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// Loading Spinner with Animation
interface AnimatedSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AnimatedSpinner({ 
  size = 'md', 
  className = '' 
}: AnimatedSpinnerProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  if (prefersReducedMotion) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-blue-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg
        className="w-full h-full text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

// Progress Bar Animation
interface AnimatedProgressProps {
  progress: number
  duration?: number
  className?: string
}

export function AnimatedProgress({ 
  progress, 
  duration = 1000,
  className = '' 
}: AnimatedProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedProgress(progress)
      return
    }

    const startTime = Date.now()
    const startProgress = animatedProgress

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      
      const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3)
      const currentProgress = startProgress + (progress - startProgress) * easeOutCubic
      
      setAnimatedProgress(currentProgress)

      if (progressRatio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [progress, duration, animatedProgress, prefersReducedMotion])

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${animatedProgress}%` }}
      />
    </div>
  )
}

// Counter Animation
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ 
  value, 
  duration = 1000,
  className = '' 
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value)
      return
    }

    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      
      const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3)
      const currentValue = startValue + (value - startValue) * easeOutCubic
      
      setDisplayValue(Math.round(currentValue))

      if (progressRatio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue, prefersReducedMotion])

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  )
}

// Page Transition Component
interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${className}`}
      style={{
        animation: 'fadeInUp 0.3s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// Custom CSS Animations (to be added to globals.css)
export const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes rotateIn {
  from {
    transform: rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: rotate(0deg);
    opacity: 1;
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.5s ease-out;
}

.animate-slide-in-down {
  animation: slideInDown 0.5s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

.animate-rotate-in {
  animation: rotateIn 0.5s ease-out;
}
`

// Animation Presets
export const animationPresets = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  scaleIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  bounceIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      duration: 0.6, 
      ease: [0.68, -0.55, 0.265, 1.55] 
    }
  }
}
