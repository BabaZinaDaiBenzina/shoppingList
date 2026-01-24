/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

/**
 * Trigger haptic feedback on supported devices
 * Falls back gracefully on unsupported platforms
 */
export function haptic(type: HapticType = 'light'): void {
  // Check if running in browser
  if (typeof window === 'undefined') return

  // Check if navigator.vibrate is supported
  if (!('vibrate' in navigator)) return

  // Vibration patterns for different feedback types
  const patterns: Record<HapticType, number | number[]> = {
    // Subtle feedback for taps and light interactions
    light: 10,

    // Standard feedback for button presses
    medium: 20,

    // Strong feedback for important actions
    heavy: [30, 50, 30],

    // Success feedback (double tick)
    success: [10, 50, 10],

    // Warning feedback (two medium pulses)
    warning: [20, 100, 20],

    // Error feedback (strong double pulse)
    error: [50, 100, 50, 100, 50],

    // Selection feedback (short single tick)
    selection: 5,
  }

  try {
    const pattern = patterns[type]
    navigator.vibrate(pattern)
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug('Haptic feedback not available:', error)
  }
}

/**
 * Convenience methods for common haptic patterns
 */
export const haptics = {
  // Light tap feedback
  tap: () => haptic('light'),

  // Button press feedback
  press: () => haptic('medium'),

  // Toggle switch feedback
  toggle: () => haptic('selection'),

  // Success action feedback
  success: () => haptic('success'),

  // Warning feedback
  warning: () => haptic('warning'),

  // Error feedback
  error: () => haptic('error'),

  // Delete action feedback
  delete: () => haptic('heavy'),

  // Selection change feedback
  selection: () => haptic('selection'),
}
