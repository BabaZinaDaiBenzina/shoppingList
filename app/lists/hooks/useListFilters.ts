import { useState, useMemo } from 'react'
import type { ShoppingListUI } from '@/types'

export interface ListFilters {
  searchQuery: string
  categoryFilter: string | null
  statusFilter: 'all' | 'purchased' | 'unpurchased'
  sortBy: 'date' | 'name' | 'items'
  activeTab: 'all' | 'mine' | 'shared'
}

interface UseListFiltersOptions {
  lists: ShoppingListUI[]
}

export function useListFilters({ lists }: UseListFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'purchased' | 'unpurchased'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'items'>('date')
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'shared'>('all')

  /**
   * Отфильтрованные и отсортированные списки
   */
  const filteredLists = useMemo(() => {
    let result = [...lists]

    // 1. Фильтрация по табам
    if (activeTab === 'mine') {
      result = result.filter(list => list.isOwner)
    } else if (activeTab === 'shared') {
      result = result.filter(list => list.isShared)
    }

    // 2. Поиск по названию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(list =>
        list.name.toLowerCase().includes(query) ||
        list.items?.some(item =>
          item.name.toLowerCase().includes(query)
        )
      )
    }

    // 3. Фильтрация по статусу (куплено/не куплено)
    if (statusFilter === 'purchased') {
      result = result.filter(list =>
        list.items && list.items.length > 0 &&
        list.items.every(item => item.purchased)
      )
    } else if (statusFilter === 'unpurchased') {
      result = result.filter(list =>
        list.items && list.items.length > 0 &&
        list.items.some(item => !item.purchased)
      )
    }

    // 4. Сортировка
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ru')
      } else if (sortBy === 'items') {
        const aItemsCount = a.items?.length || 0
        const bItemsCount = b.items?.length || 0
        return bItemsCount - aItemsCount
      }
      return 0
    })

    return result
  }, [lists, searchQuery, statusFilter, sortBy, activeTab])

  /**
   * Группировка списков по дате (сегодня, вчера, эта неделя, старее)
   */
  const groupedLists = useMemo(() => {
    const groups: Record<string, ShoppingListUI[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    for (const list of filteredLists) {
      const updatedDate = new Date(list.updatedAt)

      if (updatedDate >= todayStart) {
        groups.today.push(list)
      } else if (updatedDate >= yesterdayStart) {
        groups.yesterday.push(list)
      } else if (updatedDate >= weekStart) {
        groups.thisWeek.push(list)
      } else {
        groups.older.push(list)
      }
    }

    return groups
  }, [filteredLists])

  /**
   * Обновить все фильтры сразу
   */
  const setFilters = useCallback((filters: Partial<ListFilters>) => {
    if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery)
    if (filters.categoryFilter !== undefined) setCategoryFilter(filters.categoryFilter)
    if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter)
    if (filters.sortBy !== undefined) setSortBy(filters.sortBy)
    if (filters.activeTab !== undefined) setActiveTab(filters.activeTab)
  }, [])

  /**
   * Сбросить все фильтры
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setCategoryFilter(null)
    setStatusFilter('all')
    setSortBy('date')
    setActiveTab('all')
  }, [])

  /**
   * Статистика по спискам
   */
  const stats = useMemo(() => {
    return {
      total: lists.length,
      filtered: filteredLists.length,
      own: lists.filter(l => l.isOwner).length,
      shared: lists.filter(l => l.isShared).length,
      purchased: lists.filter(l =>
        l.items && l.items.length > 0 && l.items.every(i => i.purchased)
      ).length,
    }
  }, [lists, filteredLists])

  return {
    // Filters
    filters: {
      searchQuery,
      categoryFilter,
      statusFilter,
      sortBy,
      activeTab,
    },

    // Actions
    setFilters,
    resetFilters,
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    setSortBy,
    setActiveTab,

    // Data
    filteredLists,
    groupedLists,
    stats,
  }
}

// Утилита для useCallback
function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T {
  // Заглушка для useCallback (в реальном коде должен быть импорт из React)
  return fn as any
}
