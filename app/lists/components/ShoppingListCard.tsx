interface Item {
  id: string
  name: string
  quantity: number
  purchased: boolean
}

interface ShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: Item[]
}

interface ShoppingListCardProps {
  list: ShoppingList
  isExpanded: boolean
  onToggle: (listId: string) => void
  onDelete: (listId: string) => void
  onAddItem: (listId: string, itemName: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
  newItemName: string
  onItemNameChange: (listId: string, name: string) => void
}

export function ShoppingListCard({
  list,
  isExpanded,
  onToggle,
  onDelete,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  newItemName,
  onItemNameChange,
}: ShoppingListCardProps) {
  const purchasedCount = list.items.filter(i => i.purchased).length

  // Сортируем товары: сначала не купленные, потом купленные
  const sortedItems = [...list.items].sort((a, b) => {
    if (a.purchased === b.purchased) return 0
    return a.purchased ? 1 : -1
  })

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Заголовок списка */}
      <div
        className="p-4 md:p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700"
        onClick={() => onToggle(list.id)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0">
              {purchasedCount}/{list.items.length}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {list.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {list.items.length} товаров • {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Удалить список "${list.name}"?`)) {
                  onDelete(list.id)
                }
              }}
              className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
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
              onKeyPress={(e) => {
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

          {/* Список товаров */}
          {list.items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Список пуст. Добавьте первый товар!
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 md:p-4 rounded-lg transition-colors cursor-pointer ${
                    item.purchased
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-zinc-50 dark:bg-zinc-700/50'
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
      )}
    </div>
  )
}
