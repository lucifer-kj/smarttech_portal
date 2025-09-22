'use client'

import { useEffect, useRef, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Focus Management Hook
export function useFocusManagement() {
  const focusHistory = useRef<HTMLElement[]>([])
  const currentFocus = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      currentFocus.current = activeElement
      focusHistory.current.push(activeElement)
    }
  }, [])

  const restoreFocus = useCallback(() => {
    if (currentFocus.current) {
      currentFocus.current.focus()
    }
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [])

  const setInitialFocus = useCallback((element: HTMLElement) => {
    element.focus()
  }, [])

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
    setInitialFocus
  }
}

// Keyboard Navigation Hook
export function useKeyboardNavigation() {
  const handleKeyDown = useCallback((e: KeyboardEvent, handlers: Record<string, () => void>) => {
    const handler = handlers[e.key]
    if (handler) {
      e.preventDefault()
      handler()
    }
  }, [])

  const createKeyHandler = useCallback((handlers: Record<string, () => void>) => {
    return (e: KeyboardEvent) => handleKeyDown(e, handlers)
  }, [handleKeyDown])

  return { createKeyHandler }
}

// Focus Trap Component
interface FocusTrapProps {
  children: ReactNode
  active: boolean
  onEscape?: () => void
}

export function FocusTrap({ children, active, onEscape }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { trapFocus } = useFocusManagement()

  useEffect(() => {
    if (active && containerRef.current) {
      const cleanup = trapFocus(containerRef.current)
      return cleanup
    }
  }, [active, trapFocus])

  useEffect(() => {
    if (!active) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [active, onEscape])

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  )
}

// Skip Links Component
export function SkipLinks() {
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' }
  ]

  return (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 z-50"
        >
          {link.text}
        </a>
      ))}
    </div>
  )
}

// Keyboard Shortcuts Component
interface KeyboardShortcutsProps {
  shortcuts: Array<{
    key: string
    description: string
    action: () => void
    condition?: () => boolean
  }>
  children: ReactNode
}

export function KeyboardShortcuts({ shortcuts, children }: KeyboardShortcutsProps) {
  const { createKeyHandler } = useKeyboardNavigation()

  useEffect(() => {
    const handlers: Record<string, () => void> = {}
    
    shortcuts.forEach(shortcut => {
      if (!shortcut.condition || shortcut.condition()) {
        handlers[shortcut.key] = shortcut.action
      }
    })

    const keyHandler = createKeyHandler(handlers)
    document.addEventListener('keydown', keyHandler)
    
    return () => document.removeEventListener('keydown', keyHandler)
  }, [shortcuts, createKeyHandler])

  return <>{children}</>
}

// Keyboard Shortcuts Help Modal
interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: Array<{
    key: string
    description: string
    category?: string
  }>
}

export function KeyboardShortcutsHelp({ 
  isOpen, 
  onClose, 
  shortcuts 
}: KeyboardShortcutsHelpProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, typeof shortcuts>)

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-gray-700">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-200 border border-gray-300 rounded text-xs">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Accessible Button Component
interface AccessibleButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  keyboardShortcut?: string
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
  ariaDescribedBy,
  keyboardShortcut
}: AccessibleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!keyboardShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === keyboardShortcut && !disabled) {
        e.preventDefault()
        onClick()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcut, onClick, disabled])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center px-4 py-2 
        border border-transparent text-sm font-medium rounded-md 
        text-white bg-blue-600 hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      title={keyboardShortcut ? `Keyboard shortcut: ${keyboardShortcut}` : undefined}
    >
      {children}
      {keyboardShortcut && (
        <kbd className="ml-2 px-1 py-0.5 bg-white/20 border border-white/30 rounded text-xs">
          {keyboardShortcut}
        </kbd>
      )}
    </button>
  )
}

// Focus Visible Polyfill
export function useFocusVisible() {
  useEffect(() => {
    // Add focus-visible polyfill if needed
    if (typeof window !== 'undefined' && !window.CSS?.supports?.('selector(:focus-visible)')) {
      import('focus-visible')
    }
  }, [])
}

// ARIA Live Region Component
interface AriaLiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  className?: string
}

export function AriaLiveRegion({ 
  message, 
  politeness = 'polite',
  className = ''
}: AriaLiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
}

// Screen Reader Only Text
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// High Contrast Mode Detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)')
        setIsHighContrast(mediaQuery.matches)
        
        mediaQuery.addEventListener('change', (e) => {
          setIsHighContrast(e.matches)
        })
      }
    }

    checkHighContrast()
  }, [])

  return isHighContrast
}

// Reduced Motion Detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      mediaQuery.addEventListener('change', (e) => {
        setPrefersReducedMotion(e.matches)
      })
    }
  }, [])

  return prefersReducedMotion
}

// Color Scheme Detection
export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference')

  useEffect(() => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setColorScheme(mediaQuery.matches ? 'dark' : 'light')
      
      mediaQuery.addEventListener('change', (e) => {
        setColorScheme(e.matches ? 'dark' : 'light')
      })
    }
  }, [])

  return colorScheme
}
