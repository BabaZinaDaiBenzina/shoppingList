interface GroceryCategory {
  id: string
  name: string
  icon: string
  items: string[]
}

interface RecommendationsPanelProps {
  recommendations: GroceryCategory[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
  onAddItem: (itemName: string) => void
  onAddCategory: (items: string[]) => void
  isItemInList: (itemName: string) => boolean
  hasOpenList: boolean
}

export function RecommendationsPanel({
  recommendations,
  selectedCategory,
  onCategorySelect,
  onAddItem,
  onAddCategory,
  isItemInList,
  hasOpenList,
}: RecommendationsPanelProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <h3 className="font-semibold text-purple-900 dark:text-purple-50 mb-3 text-base md:text-base">
        Быстро добавить из популярных товаров:
      </h3>

      <div className="space-y-2 md:space-y-3">
        {recommendations.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => onCategorySelect(
                selectedCategory === category.id ? null : category.id
              )}
              className="w-full flex items-center gap-2 md:gap-3 p-3 md:p-3 bg-white dark:bg-zinc-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors active:scale-[0.98] min-h-[48px]"
            >
              <span className="text-xl md:text-2xl">{category.icon}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50 flex-1 text-left text-sm md:text-base">
                {category.name}
              </span>
              <svg
                className={`w-5 h-5 text-zinc-400 transition-transform ${
                  selectedCategory === category.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {selectedCategory === category.id && (
              <div className="mt-2 md:mt-2">
                {/* Кнопка добавить всю категорию */}
                <div className="mb-2 md:mb-3 flex gap-2">
                  <button
                    onClick={() => onAddCategory(category.items)}
                    disabled={!hasOpenList}
                    className="flex-1 px-4 py-3 md:py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95 min-h-[48px] text-sm md:text-sm"
                  >
                    <span className="text-lg md:text-base">📥</span>
                    <span className="hidden sm:inline">Добавить всю категорию</span>
                    <span className="sm:hidden">Добавить все</span>
                  </button>
                </div>

                {/* Товары категории */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {category.items.map((item) => {
                    const isInList = isItemInList(item)

                    return (
                      <button
                        key={item}
                        onClick={() => onAddItem(item)}
                        disabled={isInList || !hasOpenList}
                        className={`px-3 py-3 md:py-2 rounded-lg text-sm md:text-sm transition-colors active:scale-95 min-h-[48px] ${
                          isInList
                            ? 'bg-green-500 text-white cursor-default'
                            : !hasOpenList
                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                            : 'bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-50'
                        }`}
                      >
                        {isInList ? '✓ ' : '+ '}{item}
                      </button>
                    )
                  })}
                </div>

                {/* Предупреждение если нет открытого списка */}
                {!hasOpenList && (
                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 text-center bg-yellow-50 dark:bg-yellow-900/20 py-2 px-3 rounded-lg">
                    ⚠️ Откройте список, чтобы добавлять товары
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
