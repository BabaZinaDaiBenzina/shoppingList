'use client'

import { useState, useRef, useEffect } from 'react'

interface Product {
  id: string
  name: string
  unit: string | null
  category: {
    id: string
    name: string
    icon: string | null
  }
}

interface Item {
  id: string
  name: string
  quantity: number
  purchased: boolean
  product?: Product | null
}

interface ShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: Item[]
  isShared?: boolean
  isOwner?: boolean
  user?: {
    id: string
    username: string
    name: string | null
  }
}

interface GroupedShoppingListCardProps {
  list: ShoppingList
  isExpanded: boolean
  onToggle: (listId: string) => void
  onDelete: (listId: string) => void
  onShare?: (listId: string) => void
  onAddItem: (listId: string, itemName: string, productId?: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
  onDeselectAll: (listId: string) => void
  newItemName: string
  onItemNameChange: (listId: string, name: string) => void
}

export function GroupedShoppingListCard({
  list,
  isExpanded,
  onToggle,
  onDelete,
  onShare,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onDeselectAll,
  newItemName,
  onItemNameChange,
}: GroupedShoppingListCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const purchasedCount = list.items.filter(i => i.purchased).length

  // Закрыть дропдаун при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Группируем товары по категориям
  const groupedItems = list.items.reduce((acc, item) => {
    const categoryName = item.product?.category.name || 'Без категории'
    const categoryIcon = item.product?.category.icon || '📦'
    const categoryId = item.product?.category.id || 'no-category'

    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        icon: categoryIcon,
        items: []
      }
    }

    acc[categoryId].items.push(item)
    return acc
  }, {} as Record<string, { id: string; name: string; icon: string; items: Item[] }>)

  // Сортируем товары: сначала не купленные, потом купленные
  Object.values(groupedItems).forEach(category => {
    category.items.sort((a, b) => {
      if (a.purchased === b.purchased) return 0
      return a.purchased ? 1 : -1
    })
  })

  // Сортируем категории: сначала с продуктами, потом пустые
  const sortedCategories = Object.values(groupedItems).sort((a, b) => {
    return a.name.localeCompare(b.name, 'ru')
  })

  const handleMenuAction = (action: () => void) => {
    action()
    setShowDropdown(false)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden ${list.isShared ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Заголовок списка */}
      <div
        className="p-4 md:p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700"
        onClick={() => onToggle(list.id)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 md:w-12 md:h-12 bg-gradient-to-br rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0 ${
              list.isShared ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-purple-600'
            }`}>
              {purchasedCount}/{list.items.length}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {list.name}
                </h2>
                {list.isShared && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full flex-shrink-0">
                    Общий
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {list.items.length} товаров • {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
                {list.isShared && list.user && (
                  <> • {list.user.name || list.user.username}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Кнопка меню (три точки) - только когда развернуто */}
            {isExpanded && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDropdown(!showDropdown)
                  }}
                  className="p-3 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Меню"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {/* Выпадающее меню */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-2 z-50">
                    {list.isOwner && onShare && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMenuAction(() => onShare(list.id))
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                      >
                        <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="text-zinc-900 dark:text-zinc-50">Поделиться списком</span>
                      </button>
                    )}

                    {purchasedCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMenuAction(() => onDeselectAll(list.id))
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                      >
                        <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-zinc-900 dark:text-zinc-50">Снять выделение ({purchasedCount})</span>
                      </button>
                    )}

                    {list.isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMenuAction(() => onDelete(list.id))
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm text-red-600 dark:text-red-400"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Удалить список</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <svg
              className={`w-5 h-5 text-zinc-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Товары (раскрытый список) */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-6">
          {/* Форма добавления товара */}
          <div className="flex gap-2 md:gap-3 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => onItemNameChange(list.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddItem(list.id, newItemName)
                }
              }}
              placeholder="Добавить товар..."
              className="flex-1 min-w-0 px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white min-h-[48px]"
            />
            <button
              onClick={() => onAddItem(list.id, newItemName)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base whitespace-nowrap flex-shrink-0"
            >
              Добавить
            </button>
          </div>

          {/* Список товаров по категориям */}
          {list.items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Список пуст. Добавьте первый товар!
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((category) => {
                const isCollapsed = !expandedCategories.has(category.id)

                return (
                  <div key={category.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    {/* Заголовок категории */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform flex-shrink-0 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{category.name}</span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        ({category.items.length})
                      </span>
                    </button>

                    {/* Товары категории */}
                    {!isCollapsed && (
                      <div className="p-2 space-y-1">
                        {category.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 md:p-3 rounded-lg transition-colors cursor-pointer ${
                              item.purchased
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-white dark:bg-zinc-800'
                            }`}
                            onClick={() => onToggleItem(list.id, item.id)}
                          >
                            <div
                              className={`flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                item.purchased
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {item.purchased && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-base md:text-sm block truncate ${
                                  item.purchased
                                    ? 'line-through text-zinc-500 dark:text-zinc-400'
                                    : 'text-zinc-900 dark:text-zinc-50'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.quantity > 1 && (
                                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                                  ×{item.quantity}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(list.id, item.id)
                              }}
                              className="p-3 md:p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
