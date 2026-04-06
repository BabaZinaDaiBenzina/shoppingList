'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { formatQuantity } from '@/lib/utils/pluralize'
import { haptics } from '@/lib/utils/haptic'
import { Badge } from '@/components/ui/badge'
import { ItemWithProduct, ShoppingListUI, Category } from '@/types'
import { SwipeableItem } from '@/components/SwipeableItem'

interface GroupedShoppingListCardProps {
  list: ShoppingListUI
  isExpanded: boolean
  onToggle: (listId: string) => void
  onDelete: (listId: string) => void
  onShare?: (listId: string) => void
  onSaveAsTemplate?: (listId: string) => void
  onAddItem: (listId: string, itemName: string, quantity?: number, unit?: string, productId?: string, categoryId?: string) => void
  onUpdateItem?: (listId: string, itemId: string, data: { quantity?: number; unit?: string }) => void
  onCopyItem?: (listId: string, itemId: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
  onDeselectAll: (listId: string) => void
  newItemName: string
  onItemNameChange: (listId: string, name: string) => void
  categories: Category[]
  selectedCategoryId: string | null
  onCategoryChange: (categoryId: string | null) => void
  isDeleting?: boolean
  isAddingItem?: boolean
  isUpdatingItem?: Record<string, boolean>
  isTogglingItem?: Record<string, boolean>
  isDeletingItem?: Record<string, boolean>
  isDeselectAll?: boolean
}

export function GroupedShoppingListCard({
  list,
  isExpanded,
  onToggle,
  onDelete,
  onShare,
  onSaveAsTemplate,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
  onDeselectAll,
  newItemName,
  onItemNameChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  isDeleting = false,
  isAddingItem = false,
  isUpdatingItem = {},
  isTogglingItem = {},
  isDeletingItem = {},
  isDeselectAll = false,
}: GroupedShoppingListCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [editUnit, setEditUnit] = useState('')
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const items = (list.items || []) as ItemWithProduct[]

  // Используем purchasedCount из API если товары не загружены, иначе считаем из items
  const totalItems = items.length > 0 ? items.length : list._count?.items || 0
  const purchasedCount = items.length > 0
    ? items.filter(i => i.purchased).length
    : (list.purchasedCount ?? 0)

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
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
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
    }, {} as Record<string, { id: string; name: string; icon: string; items: ItemWithProduct[] }>)
  }, [items])

  // Сортируем товары: сначала не купленные, потом купленные
  useMemo(() => {
    (Object.values(groupedItems) as Array<{ id: string; name: string; icon: string; items: ItemWithProduct[] }>).forEach((category) => {
      category.items.sort((a, b) => {
        if (a.purchased === b.purchased) return 0
        return a.purchased ? 1 : -1
      })
    })
  }, [groupedItems])

  // Сортируем категории: сначала с продуктами, потом пустые
  const sortedCategories = (Object.values(groupedItems) as Array<{ id: string; name: string; icon: string; items: ItemWithProduct[] }>).sort((a, b) => {
    return a.name.localeCompare(b.name, 'ru')
  })

  // Automatically expand categories with unpurchased items
  useEffect(() => {
    const categoriesWithUnpurchased = (Object.values(groupedItems) as Array<{ id: string; name: string; icon: string; items: ItemWithProduct[] }>)
      .filter(category => category.items.some(item => !item.purchased))
      .map(category => category.id)

    setExpandedCategories(new Set(categoriesWithUnpurchased))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.items])

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

  const handleAddItem = () => {
    const trimmedName = newItemName.trim()
    if (!trimmedName) return
    // Добавляем с дефолтными значениями: quantity=1, unit берётся из каталога
    onAddItem(list.id, trimmedName, 1, undefined, undefined, selectedCategoryId || undefined)
  }

  const startEditing = (item: ItemWithProduct) => {
    setEditingItemId(item.id)
    setEditQuantity(item.quantity)
    setEditUnit(item.unit || '')
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditQuantity(1)
    setEditUnit('')
  }

  const saveEdit = (itemId: string) => {
    if (onUpdateItem) {
      onUpdateItem(list.id, itemId, { quantity: editQuantity, unit: editUnit || undefined })
    }
    cancelEditing()
  }

  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden ${list.isShared ? 'ring-2 ring-purple-500' : ''}`}>
      {/* Заголовок списка */}
      <div
        className="p-4 md:p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700"
        onClick={() => {
          haptics.tap()
          onToggle(list.id)
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 md:w-12 md:h-12 bg-gradient-to-br rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0 ${
              list.isShared ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-purple-600'
            }`}>
              {purchasedCount}/{totalItems}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {list.name}
                </h2>
                {list.isShared && (
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Общий
                  </Badge>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {totalItems} товаров • {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
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
                          haptics.tap()
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

                    {list.isOwner && onSaveAsTemplate && items.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          haptics.tap()
                          handleMenuAction(() => onSaveAsTemplate(list.id))
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                      >
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span className="text-zinc-900 dark:text-zinc-50">Сохранить как шаблон</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        haptics.tap()
                        handleMenuAction(() => setShowAddItemForm(!showAddItemForm))
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                    >
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-zinc-900 dark:text-zinc-50">{showAddItemForm ? 'Скрыть форму' : 'Добавить вручную'}</span>
                    </button>

                    {purchasedCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMenuAction(() => onDeselectAll(list.id))
                        }}
                        disabled={isDeselectAll}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeselectAll ? (
                          <div className="w-5 h-5 flex-shrink-0 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-zinc-900 dark:text-zinc-50">{isDeselectAll ? 'Снятие...' : `Снять выделение (${purchasedCount})`}</span>
                      </button>
                    )}

                    {list.isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMenuAction(() => onDelete(list.id))
                        }}
                        disabled={isDeleting}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <div className="w-5 h-5 flex-shrink-0 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        <span>{isDeleting ? 'Удаление...' : 'Удалить список'}</span>
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
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-3">
          {/* Форма добавления товара */}
          {showAddItemForm && (
            <div className="space-y-3 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => onItemNameChange(list.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
              placeholder="Добавить товар..."
              disabled={isAddingItem}
              className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Селектор категорий */}
            <div className="max-h-[125px] overflow-y-auto -mx-2 px-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onCategoryChange(null)}
                  disabled={isAddingItem}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${
                    selectedCategoryId === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Без категории
                </button>
                {categories.map((category) => {
                  const displayName = category.name.length > 8
                    ? category.name.slice(0, 3) + '...'
                    : category.name

                  return (
                    <button
                      key={category.id}
                      onClick={() => onCategoryChange(category.id)}
                      disabled={isAddingItem}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center truncate ${
                        selectedCategoryId === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={category.name}
                    >
                      {category.icon} {displayName}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleAddItem}
              disabled={isAddingItem}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAddingItem ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Добавление...</span>
                </>
              ) : (
                'Добавить'
              )}
            </button>
          </div>
          )}

          {/* Список товаров по категориям */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              {showAddItemForm ? (
                'Список пуст. Введите название товара выше!'
              ) : (
                <>
                  <p className="mb-2">Список пуст.</p>
                  <p className="text-sm">Нажмите на меню (...) и выберите &quot;Добавить вручную&quot;</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((category) => {
                const isCollapsed = !expandedCategories.has(category.id)
                const purchasedInCategory = category.items.filter(i => i.purchased).length

                return (
                  <div key={category.id} className="rounded-lg overflow-hidden">
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
                        ({purchasedInCategory}/{category.items.length})
                      </span>
                    </button>

                    {/* Товары категории */}
                    {!isCollapsed && (
                      <div className="p-1 space-y-1">
                        {category.items.map((item) => {
                          const itemKey = `${list.id}-${item.id}`
                          const isToggling = isTogglingItem[itemKey]
                          const isDeleting = isDeletingItem[itemKey]
                          const isUpdating = isUpdatingItem[itemKey]
                          const isEditing = editingItemId === item.id
                          const displayUnit = item.unit || item.product?.unit

                          return (
                            <SwipeableItem
                              key={item.id}
                              onToggle={() => {
                                if (!isToggling && !isEditing) {
                                  haptics.toggle()
                                  onToggleItem(list.id, item.id)
                                }
                              }}
                              onDelete={() => onDeleteItem(list.id, item.id)}
                              isPurchased={item.purchased}
                              disabled={isToggling || isDeleting || isUpdating || isEditing}
                            >
                              <div
                                className={`flex items-center gap-2 p-1 rounded-lg ${
                                  item.purchased
                                    ? 'bg-green-50 dark:bg-green-900/20'
                                    : 'bg-white dark:bg-zinc-800'
                                }`}
                              >
                                {/* Чекбокс */}
                                <div
                                  className={`flex-shrink-0 w-8 h-8 min-w-[34px] min-h-[34px] rounded-lg border-1 flex items-center justify-center transition-colors ${
                                    item.purchased
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-zinc-300 dark:border-zinc-600'
                                  }`}
                                >
                                  {isToggling ? (
                                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                  ) : item.purchased ? (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : null}
                                </div>

                                {/* Информация о товаре */}
                                <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                    // Режим редактирования
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="number"
                                        value={editQuantity}
                                        onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                                        min="1"
                                        className="w-16 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                                      />
                                      <input
                                        type="text"
                                        value={editUnit}
                                        onChange={(e) => setEditUnit(e.target.value)}
                                        onFocus={(e) => {
                                          e.target.setSelectionRange(0, e.target.value.length)
                                        }}
                                        placeholder="шт"
                                        className="w-16 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          saveEdit(item.id)
                                        }}
                                        disabled={isUpdating}
                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                                      >
                                        {isUpdating ? (
                                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          cancelEditing()
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    // Режим просмотра
                                    <div className={`flex items-center gap-2 ${item.purchased ? 'line-through' : ''}`}>
                                      <span className="flex-1 min-w-0 text-sm md:text-base truncate text-zinc-900 dark:text-zinc-50">
                                        {item.name}
                                      </span>
                                      {(item.quantity > 1 || displayUnit) && (
                                        <span className="flex-shrink-0 text-sm text-zinc-600 dark:text-zinc-400 text-right">
                                          {formatQuantity(item.quantity, displayUnit || null)}
                                        </span>
                                      )}
                                      {item.purchased && (
                                        <Badge variant="secondary" className="hidden sm:inline-flex bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex-shrink-0">
                                          ✓ Куплено
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Кнопка редактирования количества */}
                                {!isEditing && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      haptics.tap()
                                      startEditing(item)
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                                    title="Изменить количество"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </SwipeableItem>
                          )
                        })}
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
