'use client'

import { ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { haptics } from '@/lib/utils/haptic'

interface SwipeableItemProps {
  children: ReactNode
  onToggle: () => void
  onDelete: () => void
  isPurchased: boolean
  disabled?: boolean
}

const SWIPE_THRESHOLD = 80
const SWIPE_CONFIRM_THRESHOLD = 120

export function SwipeableItem({
  children,
  onToggle,
  onDelete,
  isPurchased,
  disabled = false,
}: SwipeableItemProps) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])
  const purchaseOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [0, 0, 1])
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0, 0])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled) return

    const offset = info.offset.x

    // Свайп вправо → toggle purchased
    if (offset > SWIPE_CONFIRM_THRESHOLD) {
      haptics.toggle()
      onToggle()
      return
    }

    // Свайп влево → delete
    if (offset < -SWIPE_CONFIRM_THRESHOLD) {
      haptics.delete()
      onDelete()
      return
    }
  }

  const handleDrag = (_: unknown, info: PanInfo) => {
    // Haptic feedback при достижении порога
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD && Math.abs(info.offset.x) < SWIPE_THRESHOLD + 20) {
      haptics.selection()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Фон для удаления (левый свайп) */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 pointer-events-none"
      >
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-medium">Удалить</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      </motion.div>

      {/* Фон для покупки (правый свайп) */}
      <motion.div
        style={{ opacity: purchaseOpacity }}
        className={`absolute inset-0 flex items-center justify-start pl-4 pointer-events-none ${
          isPurchased ? 'bg-orange-500' : 'bg-green-500'
        }`}
      >
        <div className="flex items-center gap-2 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isPurchased ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            )}
          </svg>
          <span className="text-sm font-medium">{isPurchased ? 'Не куплено' : 'Куплено'}</span>
        </div>
      </motion.div>

      {/* Контент */}
      <motion.div
        style={{ x, opacity }}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        whileDrag={{ scale: 1.02 }}
        className="relative bg-white dark:bg-zinc-800"
      >
        {children}
      </motion.div>
    </div>
  )
}
