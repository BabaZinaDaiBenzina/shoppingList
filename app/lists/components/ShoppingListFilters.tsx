'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import type { ListFilters } from '../hooks/useListFilters'

interface ShoppingListFiltersProps {
  filters: ListFilters
  onFilterChange: (filters: Partial<ListFilters>) => void
  stats: {
    total: number
    filtered: number
    own: number
    shared: number
  }
}

export function ShoppingListFilters({ filters, onFilterChange, stats }: ShoppingListFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Поиск списков и товаров..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Табы и сортировка */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Табы */}
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange({ activeTab: 'all' })}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все ({stats.total})
          </button>
          <button
            onClick={() => onFilterChange({ activeTab: 'mine' })}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.activeTab === 'mine'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Мои ({stats.own})
          </button>
          <button
            onClick={() => onFilterChange({ activeTab: 'shared' })}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.activeTab === 'shared'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Общие ({stats.shared})
          </button>
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">По дате</option>
            <option value="name">По названию</option>
            <option value="items">По товарам</option>
          </select>

          {/* Статус */}
          <select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange({ statusFilter: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="purchased">Купленные</option>
            <option value="unpurchased">Неполностью</option>
          </select>
        </div>
      </div>

      {/* Статистика */}
      {stats.filtered !== stats.total && (
        <p className="text-sm text-gray-600">
          Показано {stats.filtered} из {stats.total} списков
        </p>
      )}
    </div>
  )
}
