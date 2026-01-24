'use client'

import { useState } from 'react'
import { haptics } from '@/lib/utils/haptic'

interface SearchAndFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryFilter: string | null
  onCategoryChange: (categoryId: string | null) => void
  statusFilter: 'all' | 'purchased' | 'unpurchased'
  onStatusChange: (status: 'all' | 'purchased' | 'unpurchased') => void
  sortBy: 'name' | 'date'
  onSortChange: (sort: 'name' | 'date') => void
  categories: Array<{ id: string; name: string; icon: string | null }>
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  categories,
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-4 md:p-6 mb-4">
      {/* Поисковая строка и кнопка фильтров */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Поиск товаров..."
            className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => {
                haptics.tap()
                onSearchChange('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Очистить поиск"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => {
            haptics.press()
            setShowFilters(!showFilters)
          }}
          className={`px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px] ${
            showFilters || categoryFilter !== null || statusFilter !== 'all' || sortBy !== 'date'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
          aria-label="Фильтры"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Фильтр по категории */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Категория
            </label>
            <select
              value={categoryFilter || 'all'}
              onChange={(e) => onCategoryChange(e.target.value === 'all' ? null : e.target.value)}
              className="w-full px-4 py-2 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            >
              <option value="all">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Статус
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  haptics.selection()
                  onStatusChange('all')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => {
                  haptics.selection()
                  onStatusChange('unpurchased')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  statusFilter === 'unpurchased'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                🛒 Купить
              </button>
              <button
                onClick={() => {
                  haptics.selection()
                  onStatusChange('purchased')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  statusFilter === 'purchased'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                ✅ Куплено
              </button>
            </div>
          </div>

          {/* Сортировка */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Сортировка
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  haptics.selection()
                  onSortChange('name')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  sortBy === 'name'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                🔤 По названию
              </button>
              <button
                onClick={() => {
                  haptics.selection()
                  onSortChange('date')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                📅 По дате
              </button>
            </div>
          </div>

          {/* Сбросить все фильтры */}
          {(categoryFilter !== null || statusFilter !== 'all' || sortBy !== 'date' || searchQuery) && (
            <button
              onClick={() => {
                haptics.tap()
                onCategoryChange(null)
                onStatusChange('all')
                onSortChange('date')
                onSearchChange('')
              }}
              className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Сбросить все фильтры
            </button>
          )}
        </div>
      )}

      {/* Индикатор активных фильтров */}
      {!showFilters && (categoryFilter !== null || statusFilter !== 'all' || sortBy !== 'date') && (
        <div className="flex flex-wrap gap-2 mt-3">
          {categoryFilter !== null && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              Категория
              <button
                onClick={() => {
                  haptics.tap()
                  onCategoryChange(null)
                }}
                className="hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-full p-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              {statusFilter === 'purchased' ? '✅ Куплено' : '🛒 Купить'}
              <button
                onClick={() => {
                  haptics.tap()
                  onStatusChange('all')
                }}
                className="hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-full p-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {sortBy !== 'date' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              🔤 A-Z
              <button
                onClick={() => {
                  haptics.tap()
                  onSortChange('date')
                }}
                className="hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-full p-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
