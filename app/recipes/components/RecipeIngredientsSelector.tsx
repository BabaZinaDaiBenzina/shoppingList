'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { haptics } from '@/lib/utils/haptic'
import { formatQuantity } from '@/lib/utils/pluralize'
import type { Category, ProductWithCategory } from '@/types'

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
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [customIngredient, setCustomIngredient] = useState({ name: '', quantity: 1, unit: '' })
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isCatalogOpen) {
      fetchCategories()
    }
  }, [isCatalogOpen])

  useEffect(() => {
    if (isCatalogOpen) {
      fetchProducts()
    }
  }, [selectedCategoryId, searchQuery, isCatalogOpen])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        const sorted = data.categories.sort((a: Category, b: Category) => a.sortOrder - b.sortOrder)
        setCategories(sorted)
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    haptics.tap()
    setQuantities((prev) => {
      const current = prev[productId] || 1
      const newValue = Math.max(1, current + delta)
      return { ...prev, [productId]: newValue }
    })
  }

  const setQuantity = (productId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, value),
    }))
  }

  const addProductFromCatalog = (product: ProductWithCategory) => {
    const quantity = quantities[product.id] || 1
    haptics.success()

    const newIngredient: RecipeIngredient = {
      productId: product.id,
      name: product.name,
      quantity,
      unit: product.unit || undefined,
      productName: product.name,
      categoryName: product.category.name,
    }

    onChange([...ingredients, newIngredient])
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }))
  }

  const isIngredientInList = (productName: string) => {
    return ingredients.some((ing) => ing.name === productName)
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
                    type="button"
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
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowCustomInput(true)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Свой ингредиент
      </Button>

      {/* FAB для каталога */}
      <div className="fixed bottom-27 right-10 z-40">
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 flex items-center justify-center"
          aria-label="Добавить из каталога"
          title="Добавить из каталога"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Кастомный ингредиент */}
      {showCustomInput && (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg space-y-3">
          <Input
            type="text"
            value={customIngredient.name}
            onChange={(e) => setCustomIngredient({ ...customIngredient, name: e.target.value })}
            placeholder="Например: Помидоры"
            autoFocus
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={customIngredient.quantity}
              onChange={(e) => setCustomIngredient({ ...customIngredient, quantity: parseFloat(e.target.value) || 0 })}
              placeholder="Кол-во"
              min="0"
              step="0.1"
            />
            <Input
              type="text"
              value={customIngredient.unit}
              onChange={(e) => setCustomIngredient({ ...customIngredient, unit: e.target.value })}
              placeholder="шт, кг, л"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addCustomIngredient}
              className="flex-1"
            >
              Добавить
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCustomInput(false)
                setCustomIngredient({ name: '', quantity: 1, unit: '' })
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Диалог выбора из каталога */}
      <Dialog open={isCatalogOpen} onOpenChange={(open) => !open && setIsCatalogOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>🍽 Каталог продуктов</DialogTitle>
            <DialogDescription>
              Добавляйте ингредиенты из каталога в ваш рецепт
            </DialogDescription>
          </DialogHeader>

          {/* Поиск */}
          <div className="mb-4">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategoryId(null)
              }}
              placeholder="🔍 Поиск продуктов..."
            />
          </div>

          {/* Категории (показываем только если нет поиска) */}
          {!searchQuery && (
            <div className="min-h-[125px] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                <Button
                  variant={selectedCategoryId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    haptics.tap()
                    setSelectedCategoryId(null)
                  }}
                  className="w-full"
                >
                  Все
                </Button>
                {categories.map((category) => {
                  const displayName =
                    category.name.length > 8
                      ? category.name.slice(0, 6) + ".."
                      : category.name

                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategoryId === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        haptics.tap()
                        setSelectedCategoryId(category.id)
                      }}
                      className="w-full truncate justify-start"
                      title={category.name}
                    >
                      <span className="mr-1">{category.icon}</span> {displayName}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Список продуктов */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {products.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {isLoading ? "Загрузка..." : "Нет продуктов"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.map((product) => {
                  const isInList = isIngredientInList(product.name)
                  const quantity = quantities[product.id] || 1

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg transition-all ${
                        isInList
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-zinc-50 dark:bg-zinc-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                            {product.name}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                            <span className="ml-1">{product.category.icon}</span>{" "}
                            {product.category.name}
                          </div>
                        </div>
                        {isInList ? (
                          <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">
                            ✓
                          </span>
                        ) : null}
                      </div>

                      {/* Quantity контрол и unit */}
                      {!isInList && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(product.id, -1)
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                e.stopPropagation()
                                setQuantity(
                                  product.id,
                                  parseInt(e.target.value) || 1,
                                )
                              }}
                              onFocus={(e) =>
                                setTimeout(() => e.target.select(), 0)
                              }
                              min="1"
                              className="w-12 h-8 px-1 py-0 text-center text-sm border-0 focus:ring-0 dark:bg-zinc-800"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-[32px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(product.id, 1)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Unit */}
                          <div className="text-sm text-zinc-600 dark:text-zinc-400 px-2 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600 flex-shrink-0 min-w-[60px] h-9 flex items-center justify-center">
                            {formatQuantity(
                              quantity,
                              product.unit?.toLocaleLowerCase() || "шт",
                            )}
                          </div>

                          {/* Кнопка добавления */}
                          <Button
                            size="sm"
                            onClick={() => {
                              haptics.success()
                              addProductFromCatalog(product)
                            }}
                            className="flex-1 h-9"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Добавить
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
