'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  icon: string | null
  _count?: {
    products: number
  }
}

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

interface ProductSelectorProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (product: Product, quantity: number) => void
  isItemInList: (productName: string) => boolean
  hasOpenList: boolean
}

export function ProductSelector({
  isOpen,
  onClose,
  onAddProduct,
  isItemInList,
  hasOpenList,
}: ProductSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Загрузка категорий при открытии
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  // Загрузка продуктов при выборе категории или поиске
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [selectedCategory, searchQuery, isOpen])

  const fetchCategories = async () => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/categories')

      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
    }
  }

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const params = new URLSearchParams()

      if (selectedCategory) {
        params.append('categoryId', selectedCategory)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/products?${params}`)

      const data = await response.json()
      if (response.ok) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Ошибка загрузки продуктов:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = (product: Product) => {
    onAddProduct(product, 1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex sm:items-center justify-center">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-2xl sm:rounded-2xl fixed bottom-0 sm:relative sm:max-h-[90vh] h-[85vh] sm:h-auto rounded-t-2xl overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              🛒 Каталог продуктов
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Поиск */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategory(null) // Сбросить категорию при поиске
              }}
              placeholder="🔍 Поиск продуктов..."
              className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Категории (показываем только если нет поиска) */}
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                Все
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Список продуктов */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
          {!hasOpenList ? (
            <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">⚠️ Откройте список, чтобы добавлять товары</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              {isLoading ? 'Загрузка...' : 'Нет продуктов'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.map((product) => {
                const isInList = isItemInList(product.name)

                return (
                  <button
                    key={product.id}
                    onClick={() => !isInList && handleAddProduct(product)}
                    disabled={isInList}
                    className={`p-4 rounded-lg text-left transition-all ${
                      isInList
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 cursor-default'
                        : 'bg-zinc-50 dark:bg-zinc-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                          {product.category.icon} {product.category.name}
                          {product.unit && (
                            <>
                              <span>•</span>
                              <span>{product.unit}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isInList ? (
                        <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">+</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
