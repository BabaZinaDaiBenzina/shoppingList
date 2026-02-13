'use client'

import { useRef, useCallback, useEffect } from 'react'
import { haptics } from '@/lib/utils/haptic'

interface UseLongPressProps {
  onLongPress: () => void
  onClick?: () => void
  threshold?: number // мс до срабатывания
  cancelOnMove?: boolean // отменять при движении
  disabled?: boolean
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  cancelOnMove = true,
  disabled = false,
}: UseLongPressProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPressedRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return

    // Определяем начальную позицию
    let clientX = 0
    let clientY = 0

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    startPosRef.current = { x: clientX, y: clientY }
    isPressedRef.current = true

    timeoutRef.current = setTimeout(() => {
      if (isPressedRef.current) {
        haptics.press()
        onLongPress()
        isPressedRef.current = false
      }
    }, threshold)
  }, [disabled, onLongPress, threshold])

  const cancel = useCallback((shouldClick = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const wasPressed = isPressedRef.current
    isPressedRef.current = false
    startPosRef.current = null

    // Если это был клик (не long press), вызываем onClick
    if (shouldClick && wasPressed && onClick) {
      onClick()
    }
  }, [onClick])

  const move = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPressedRef.current || !cancelOnMove) return

    // Проверяем, значительно ли сдвинулся курсор/палец
    let clientX = 0
    let clientY = 0

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const startPos = startPosRef.current
    if (startPos) {
      const diffX = Math.abs(clientX - startPos.x)
      const diffY = Math.abs(clientY - startPos.y)

      // Если сдвинулись больше чем на 10px, отменяем
      if (diffX > 10 || diffY > 10) {
        cancel(false)
      }
    }
  }, [cancelOnMove, cancel])

  // Очищаем timeout при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const mouseHandlers = {
    onMouseDown: start,
    onMouseUp: () => cancel(true),
    onMouseLeave: () => cancel(false),
    onMouseMove: move,
  }

  const touchHandlers = {
    onTouchStart: start,
    onTouchEnd: () => cancel(true),
    onTouchMove: move,
  }

  return {
    ...mouseHandlers,
    ...touchHandlers,
  }
}
