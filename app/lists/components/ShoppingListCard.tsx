'use client'

import { memo } from 'react'
import type { ShoppingListUI } from '@/types'

interface ShoppingListCardProps {
  list: ShoppingListUI
  onOpenList: (listId: string) => void
  onDeleteList: (listId: string) => void
  isDeleting: boolean
}

/**
 * Memoized shopping list card component
 * Only re-renders when list data, isDeleting state, or callbacks change
 */
export const ShoppingListCard = memo<ShoppingListCardProps>(({
  list,
  onOpenList,
  onDeleteList,
  isDeleting,
}) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpenList(list.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{list.name}</h3>
          <p className="text-sm text-gray-500">
            {list.items?.length || 0} товаров
            {list.purchasedCount !== undefined && list.purchasedCount > 0 && (
              <>
                {' '}• {list.purchasedCount} куплено
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Обновлено: {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteList(list.id)
          }}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed px-3 py-1 text-sm"
        >
          {isDeleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>

      {list.isShared && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
          <span className="px-2 py-1 bg-blue-50 rounded">Общий список</span>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.list.id === nextProps.list.id &&
    prevProps.list.name === nextProps.list.name &&
    prevProps.list.updatedAt === nextProps.list.updatedAt &&
    prevProps.list.items?.length === nextProps.list.items?.length &&
    prevProps.list.purchasedCount === nextProps.list.purchasedCount &&
    prevProps.list.isShared === nextProps.list.isShared &&
    prevProps.isDeleting === nextProps.isDeleting &&
    prevProps.onOpenList === nextProps.onOpenList &&
    prevProps.onDeleteList === nextProps.onDeleteList
  )
})

ShoppingListCard.displayName = 'ShoppingListCard'
