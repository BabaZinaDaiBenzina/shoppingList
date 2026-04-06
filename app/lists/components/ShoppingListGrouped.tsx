'use client'

import { useState, memo, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ShoppingListUI } from '@/types'
import { ShoppingListCard } from './ShoppingListCard'

interface ShoppingListGroupedProps {
  groups: {
    today: ShoppingListUI[]
    yesterday: ShoppingListUI[]
    thisWeek: ShoppingListUI[]
    older: ShoppingListUI[]
  }
  onOpenList: (listId: string) => void
  onDeleteList: (listId: string) => void
  isDeleting: Record<string, boolean>
}

const GROUP_LABELS = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  thisWeek: 'Эта неделя',
  older: 'Старее',
} as const

/**
 * Memoized group header component
 */
const GroupHeader = memo<{
  groupKey: string
  label: string
  count: number
  isExpanded: boolean
  onToggle: () => void
}>(({ groupKey, label, count, isExpanded, onToggle }) => {
  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3 hover:text-gray-900 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      <span className="text-sm font-normal text-gray-500">({count})</span>
    </button>
  )
})

GroupHeader.displayName = 'GroupHeader'

/**
 * Memoized group component
 */
const ShoppingListGroup = memo<{
  groupKey: keyof typeof GROUP_LABELS
  lists: ShoppingListUI[]
  isExpanded: boolean
  onToggle: (groupKey: string) => void
  onOpenList: (listId: string) => void
  onDeleteList: (listId: string) => void
  isDeleting: Record<string, boolean>
}>(({ groupKey, lists, isExpanded, onToggle, onOpenList, onDeleteList, isDeleting }) => {
  if (lists.length === 0) return null

  return (
    <div className="mb-6">
      <GroupHeader
        groupKey={groupKey}
        label={GROUP_LABELS[groupKey]}
        count={lists.length}
        isExpanded={isExpanded}
        onToggle={() => onToggle(groupKey)}
      />

      {isExpanded && (
        <div className="space-y-3">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onOpenList={onOpenList}
              onDeleteList={onDeleteList}
              isDeleting={isDeleting[list.id] || false}
            />
          ))}
        </div>
      )}
    </div>
  )
})

ShoppingListGroup.displayName = 'ShoppingListGroup'

/**
 * Memoized empty state component
 */
const EmptyState = memo(() => (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg mb-2">Списков пока нет</p>
    <p className="text-gray-400 text-sm">Создайте свой первый список покупок</p>
  </div>
))

EmptyState.displayName = 'EmptyState'

/**
 * Shopping lists grouped by date with React.memo optimization
 * Only re-renders when groups, callbacks, or isDeleting states change
 */
export const ShoppingListGrouped = memo<ShoppingListGroupedProps>(({
  groups,
  onOpenList,
  onDeleteList,
  isDeleting,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today']))

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Memoize callbacks to prevent child re-renders
  const handleToggleGroup = useMemo(() => toggleGroup, [])

  const hasLists = useMemo(() =>
    Object.values(groups).some(lists => lists.length > 0),
    [groups]
  )

  return (
    <div>
      <ShoppingListGroup
        groupKey="today"
        lists={groups.today}
        isExpanded={expandedGroups.has('today')}
        onToggle={handleToggleGroup}
        onOpenList={onOpenList}
        onDeleteList={onDeleteList}
        isDeleting={isDeleting}
      />
      <ShoppingListGroup
        groupKey="yesterday"
        lists={groups.yesterday}
        isExpanded={expandedGroups.has('yesterday')}
        onToggle={handleToggleGroup}
        onOpenList={onOpenList}
        onDeleteList={onDeleteList}
        isDeleting={isDeleting}
      />
      <ShoppingListGroup
        groupKey="thisWeek"
        lists={groups.thisWeek}
        isExpanded={expandedGroups.has('thisWeek')}
        onToggle={handleToggleGroup}
        onOpenList={onOpenList}
        onDeleteList={onDeleteList}
        isDeleting={isDeleting}
      />
      <ShoppingListGroup
        groupKey="older"
        lists={groups.older}
        isExpanded={expandedGroups.has('older')}
        onToggle={handleToggleGroup}
        onOpenList={onOpenList}
        onDeleteList={onDeleteList}
        isDeleting={isDeleting}
      />

      {!hasLists && <EmptyState />}
    </div>
  )
})

ShoppingListGrouped.displayName = 'ShoppingListGrouped'
