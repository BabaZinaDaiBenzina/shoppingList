'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { haptics } from '@/lib/utils/haptic'
import type { Category, Product } from '@/types'

interface RecipeIngredient {
  productId?: string
  name?: string
  quantity: number
  unit?: string
  productName?: string  // для отображения
  categoryName?: string
}

interface RecipeIngredientsSelectorProps {
  ingredients: RecipeIngredient[]
  onChange: (ingredients: RecipeIngredient[]) => void
}

/**
 * Компонент для выбора ингредиентов из каталога при создании рецепта
 *
 * Позволяет:
 * - Выбирать продукты из каталога (с productId)
 * - Или добавлять кастомные ингредиенты (только name)
 * - Указывать количество и единицу измерения
 */
export function RecipeIngredientsSelector({ ingredients, onChange }: RecipeIngredientsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [customIngredient, setCustomIngredient] = useState({ name: '', quantity: 1, unit: '' })
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchProducts()
    }
  }, [isOpen])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategoryId])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const url = selectedCategoryId
        ? `/api/products?categoryId=${selectedCategoryId}`
        : '/api/products'

      const response = await fetch(url)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error)
    }
  }

  const addProductFromCatalog = (product: Product) => {
    haptics.tap()

    const newIngredient: RecipeIngredient = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || undefined,
      productName: product.name,
    }

    onChange([...ingredients, newIngredient])
  }

  const addCustomIngredient = () => {
    if (!customIngredient.name.trim()) return

    haptics.tap()

    const newIngredient: RecipeIngredient = {
      name: customIngredient.name.trim(),
      quantity: customIngredient.quantity || 1,
      unit: customIngredient.unit || undefined,
    }

    onChange([...ingredients, newIngredient])
    setCustomIngredient({ name: '', quantity: 1, unit: '' })
    setShowCustomInput(false)
  }

  const removeIngredient = (index: number) => {
    haptics.delete()
    onChange(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...ingredients]
    updated[index].quantity = quantity
    onChange(updated)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Список выбранных ингредиентов */}
      {ingredients.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Выбранные ингредиенты ({ingredients.length}):
          </label>
          <div className="space-y-2">
            {ingredients.map((ingredient, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {ingredient.productName || ingredient.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {ingredient.productId ? '📦 Из каталога' : '✏️ Кастомный'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredientQuantity(idx, parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12">
                    {ingredient.unit || 'шт'}
                  </span>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка добавления кастомного ингредиента */}
      <button
        type="button"
        onClick={() => setShowCustomInput(true)}
        className="w-full px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Свой ингредиент
      </button>

      {/* FAB для каталога */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 flex items-center justify-center"
          aria-label="Добавить из каталога"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Кастомный ингредиент */}
      {showCustomInput && (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg space-y-3">
          <input
            type="text"
            value={customIngredient.name}
            onChange={(e) => setCustomIngredient({ ...customIngredient, name: e.target.value })}
            placeholder="Например: Помидоры"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={customIngredient.quantity}
              onChange={(e) => setCustomIngredient({ ...customIngredient, quantity: parseFloat(e.target.value) || 0 })}
              placeholder="Кол-во"
              className="w-24 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base min-w-0"
              min="0"
              step="0.1"
            />
            <input
              type="text"
              value={customIngredient.unit}
              onChange={(e) => setCustomIngredient({ ...customIngredient, unit: e.target.value })}
              placeholder="шт, кг, л"
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base min-w-0"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustomIngredient}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-base"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false)
                setCustomIngredient({ name: '', quantity: 1, unit: '' })
              }}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors text-base"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка выбора из каталога */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Заголовок */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Выберите продукты
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск продуктов..."
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>

            {/* Категории */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  Все
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Список продуктов */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  Продукты не найдены
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addProductFromCatalog(product)
                      setIsOpen(false)
                    }}
                    className="w-full p-3 text-left bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {product.name}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {product.unit && `${product.unit}`}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
