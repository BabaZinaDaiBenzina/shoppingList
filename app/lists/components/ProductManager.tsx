'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  icon: string | null
  sortOrder: number
  products?: Product[]
}

interface Product {
  id: string
  name: string
  unit: string | null
  categoryId: string
}

interface ProductManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function ProductManager({
  isOpen,
  onClose,
}: ProductManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Forms
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', sortOrder: 0 })
  const [productForm, setProductForm] = useState({ name: '', categoryId: '', unit: '' })

  // Загрузка категорий при открытии
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/categories/admin', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories)
      } else {
        setError(data.error || 'Ошибка загрузки')
      }
    } catch (err) {
      setError('Ошибка загрузки категорий')
    } finally {
      setIsLoading(false)
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', icon: '', sortOrder: 0 })
    setEditingCategory(null)
    setShowCategoryForm(false)
  }

  const resetProductForm = () => {
    setProductForm({ name: '', categoryId: '', unit: '' })
    setEditingProduct(null)
    setShowProductForm(false)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      icon: category.icon || '',
      sortOrder: category.sortOrder
    })
    setShowCategoryForm(true)
    setShowProductForm(false)
  }

  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      categoryId: product.categoryId,
      unit: product.unit || ''
    })
    setShowProductForm(true)
    setShowCategoryForm(false)
  }

  const startAddProduct = (categoryId: string) => {
    setEditingProduct(null)
    setProductForm({ name: '', categoryId, unit: '' })
    setShowProductForm(true)
    setShowCategoryForm(false)
  }

  const saveCategory = async () => {
    setError('')
    try {
      const token = localStorage.getItem('token')
      const url = editingCategory
        ? `/api/categories/admin/${editingCategory.id}`
        : '/api/categories/admin'

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения')
      }

      await fetchCategories()
      resetCategoryForm()
      // onSuccess() // Не закрываем меню при сохранении
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить категорию?')) return

    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/categories/admin/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка удаления')
      }

      await fetchCategories()
      // onSuccess() // Не закрываем меню при удалении
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const saveProduct = async () => {
    setError('')
    try {
      const token = localStorage.getItem('token')
      const url = editingProduct
        ? `/api/products/admin/${editingProduct.id}`
        : '/api/products/admin'

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productForm),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения')
      }

      await fetchCategories()
      resetProductForm()
      // onSuccess() // Не закрываем меню при сохранении продукта
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить продукт?')) return

    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products/admin/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка удаления')
      }

      await fetchCategories()
      // onSuccess() // Не закрываем меню при удалении
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              📦 Управление каталогом
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

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Кнопка добавления категории */}
          {!showCategoryForm && !showProductForm && (
            <div className="mt-4">
              <button
                onClick={() => {
                  resetCategoryForm()
                  setShowCategoryForm(true)
                }}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить категорию
              </button>
            </div>
          )}

          {/* Форма категории */}
          {showCategoryForm && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
              <h3 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
                {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Название категории"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                />
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="Emoji (например: 🥩)"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveCategory}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={resetCategoryForm}
                    className="px-4 py-3 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Форма продукта */}
          {showProductForm && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
              <h3 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
                {editingProduct ? 'Редактировать продукт' : 'Новый продукт'}
              </h3>
              <div className="space-y-3">
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Название продукта"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                />
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  placeholder="Единица измерения (шт, кг, л, г...)"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveProduct}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={resetProductForm}
                    className="px-4 py-3 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Список категорий и продуктов */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Загрузка...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Нет категорий. Создайте первую!
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  {/* Заголовок категории */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {category.name}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        ({category.products?.length || 0} продуктов)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startAddProduct(category.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Добавить продукт"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startEditCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Продукты категории */}
                  {category.products && category.products.length > 0 && (
                    <div className="p-4 space-y-2">
                      {category.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                              {product.name}
                            </div>
                            {product.unit && (
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                {product.unit}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
