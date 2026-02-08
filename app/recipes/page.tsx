'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { RecipeIngredientsSelector } from './components/RecipeIngredientsSelector'
import { RecipeShareModal } from './components/RecipeShareModal'
import { RECIPE_CATEGORIES, type RecipeCategoryKey } from '@/types'
import type { Recipe, ShoppingList } from '@/types'

interface RecipeIngredient {
  productId?: string
  name?: string
  productName?: string  // для отображения
  quantity: number
  unit?: string
}

export default function RecipesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    ingredients: [] as RecipeIngredient[],
    instructions: '',
    cookingTime: '',
    servings: '',
    category: 'OTHER' as RecipeCategoryKey,
  })

  // Для добавления в список покупок
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [showListSelector, setShowListSelector] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedListId, setSelectedListId] = useState('')

  // Dropdown menus для каждого рецепта
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareRecipe, setShareRecipe] = useState<Recipe | null>(null)

  // Поиск и фильтрация
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategoryKey | 'ALL'>('ALL')
  const [selectedCookingTime, setSelectedCookingTime] = useState<'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'>('ALL')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Расчёт на порции - храним custom servings для каждого рецепта
  const [customServings, setCustomServings] = useState<Record<string, number>>({})

  // Получить кол-во порций для рецепта (custom или base)
  const getServingsForRecipe = (recipe: Recipe): number => {
    return customServings[recipe.id] || recipe.servings || 1
  }

  // Рассчитать ингредиенты с учётом порций
  const calculateIngredients = (recipe: Recipe): RecipeIngredient[] => {
    const ingredients = JSON.parse(recipe.ingredients || '[]')
    const baseServings = recipe.servings || 1
    const targetServings = getServingsForRecipe(recipe)
    const multiplier = targetServings / baseServings

    return ingredients.map((ing: RecipeIngredient) => ({
      ...ing,
      quantity: Math.round(ing.quantity * multiplier * 100) / 100, // округление до 2 знаков
    }))
  }

  // Фильтрация рецептов
  const filteredRecipes = recipes.filter((recipe) => {
    // Поиск по названию
    const matchesSearch = searchQuery === '' ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())

    // Фильтр по категории
    const matchesCategory = selectedCategory === 'ALL' ||
      recipe.category === selectedCategory

    // Фильтр по времени приготовления
    let matchesCookingTime = true
    if (selectedCookingTime !== 'ALL' && recipe.cookingTime) {
      if (selectedCookingTime === 'SHORT') {
        matchesCookingTime = recipe.cookingTime < 30
      } else if (selectedCookingTime === 'MEDIUM') {
        matchesCookingTime = recipe.cookingTime >= 30 && recipe.cookingTime <= 60
      } else if (selectedCookingTime === 'LONG') {
        matchesCookingTime = recipe.cookingTime > 60
      }
    } else if (selectedCookingTime !== 'ALL' && !recipe.cookingTime) {
      matchesCookingTime = false
    }

    // Фильтр по избранному
    const matchesFavorites = !showFavoritesOnly || recipe.isFavorite

    return matchesSearch && matchesCategory && matchesCookingTime && matchesFavorites
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecipes()
      fetchShoppingLists()
    }
  }, [isAuthenticated])

  // Закрыть dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && dropdownRefs.current[openDropdownId]) {
        const ref = dropdownRefs.current[openDropdownId]
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdownId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdownId])

  const fetchRecipes = async () => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/recipes')

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке рецептов')

      setRecipes(data.recipes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке рецептов')
    } finally {
      setIsLoading(false)
    }
  }

  const createRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecipe.title.trim()) return
    if (newRecipe.ingredients.length === 0) {
      setError('Добавьте хотя бы один ингредиент')
      return
    }

    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newRecipe.title,
          description: newRecipe.description,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          cookingTime: newRecipe.cookingTime ? parseInt(newRecipe.cookingTime) : undefined,
          servings: newRecipe.servings ? parseInt(newRecipe.servings) : undefined,
          category: newRecipe.category,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при создании рецепта')

      setRecipes([data.recipe, ...recipes])
      setNewRecipe({
        title: '',
        description: '',
        ingredients: [],
        instructions: '',
        cookingTime: '',
        servings: '',
        category: 'OTHER',
      })
      setShowCreateForm(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании рецепта')
    }
  }

  const deleteRecipe = async (recipeId: string) => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении рецепта')
      }

      setRecipes(recipes.filter(recipe => recipe.id !== recipeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении рецепта')
    }
  }

  const startEdit = (recipe: Recipe) => {
    const ingredients = JSON.parse(recipe.ingredients || '[]') as RecipeIngredient[]
    setEditingRecipe(recipe)
    setNewRecipe({
      title: recipe.title,
      description: recipe.description || '',
      ingredients,
      instructions: recipe.instructions || '',
      cookingTime: recipe.cookingTime?.toString() || '',
      servings: recipe.servings?.toString() || '',
      category: recipe.category as RecipeCategoryKey,
    })
    setShowCreateForm(true)
    setError('')
  }

  const cancelEdit = () => {
    setEditingRecipe(null)
    setNewRecipe({
      title: '',
      description: '',
      ingredients: [],
      instructions: '',
      cookingTime: '',
      servings: '',
      category: 'OTHER',
    })
    setShowCreateForm(false)
    setError('')
  }

  const updateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecipe) return
    if (!newRecipe.title.trim()) return
    if (newRecipe.ingredients.length === 0) {
      setError('Добавьте хотя бы один ингредиент')
      return
    }

    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/recipes/${editingRecipe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newRecipe.title,
          description: newRecipe.description,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          cookingTime: newRecipe.cookingTime ? parseInt(newRecipe.cookingTime) : undefined,
          servings: newRecipe.servings ? parseInt(newRecipe.servings) : undefined,
          category: newRecipe.category,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при обновлении рецепта')

      setRecipes(recipes.map(r => r.id === editingRecipe.id ? data.recipe : r))
      setEditingRecipe(null)
      setNewRecipe({
        title: '',
        description: '',
        ingredients: [],
        instructions: '',
        cookingTime: '',
        servings: '',
        category: 'OTHER',
      })
      setShowCreateForm(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении рецепта')
    }
  }

  const toggleFavorite = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при изменении избранного')
      }

      const data = await response.json()
      setRecipes(recipes.map(r => r.id === recipeId ? { ...r, isFavorite: data.isFavorite } : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при изменении избранного')
    }
  }

  const exportRecipeAsText = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/export?format=text`)
      if (!response.ok) throw new Error('Ошибка при экспорте')
      const data = await response.json()
      await navigator.clipboard.writeText(data.text)
      setError('Рецепт скопирован в буфер обмена!')
      setTimeout(() => setError(''), 2000)
    } catch (err) {
      setError('Ошибка при экспорте рецепта')
    }
  }

  const fetchShoppingLists = async () => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/shopping-lists')

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списков')

      setShoppingLists(data.shoppingLists || [])
    } catch (err) {
      console.error('Ошибка загрузки списков:', err)
    }
  }

  const openListSelector = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setShowListSelector(true)
  }

  const addIngredientsToList = async () => {
    if (!selectedRecipe) return

    // Используем рассчитанные ингредиенты с учётом порций
    const ingredients = calculateIngredients(selectedRecipe)
    const currentServings = getServingsForRecipe(selectedRecipe)
    let targetListId = selectedListId

    // Если список не выбран или списков нет, создаем новый
    if (!targetListId || shoppingLists.length === 0) {
      try {
        // Cookie автоматически отправляется браузером (httpOnly)
        const newListName = `🛒 ${selectedRecipe.title}`

        const response = await fetch('/api/shopping-lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newListName }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Ошибка при создании списка')
        }

        const data = await response.json()
        targetListId = data.shoppingList.id

        // Обновляем список списков
        await fetchShoppingLists()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при создании списка')
        return
      }
    }

    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      // Новый формат: ингредиенты с productId
      const promises = ingredients.map((ingredient: RecipeIngredient) =>
        fetch(`/api/shopping-lists/${targetListId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: ingredient.productId || null,
            name: ingredient.name || null,
            quantity: ingredient.quantity,
            unit: ingredient.unit || null,
          }),
        })
      )

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(res => !res.ok)

      if (failedResponses.length > 0) {
        // Проверяем на дубликаты
        const errors = await Promise.all(
          failedResponses.map(async res => {
            const data = await res.json()
            return data.error
          })
        )
        const nonDuplicateErrors = errors.filter((e: string) => !e.includes('уже есть'))

        if (nonDuplicateErrors.length > 0) {
          setError('Ошибка при добавлении ингредиентов')
          return
        }
      }

      setError(`Добавлено ${ingredients.length} ингредиентов (${currentServings} порц.) в список!`)
      setShowListSelector(false)
      setSelectedRecipe(null)
      setSelectedListId('')

      setTimeout(() => setError(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении ингредиентов')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-purple-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                📖 Мои рецепты
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Сохраняйте любимые рецепты
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors text-center text-nowrap"
              >
                На главную
              </Link>
              <button
                onClick={() => {
                  if (showCreateForm && editingRecipe) {
                    cancelEdit()
                  } else {
                    setShowCreateForm(!showCreateForm)
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {showCreateForm ? 'Отмена' : 'Создать'}
              </button>
            </div>
          </div>

          {/* Поиск и фильтрация - скрываем при создании/редактировании */}
          {!showCreateForm && (
          <div className="mt-4 space-y-3">
            {/* Строка поиска */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск рецептов..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                🔍
              </span>
            </div>

            {/* Фильтры */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Фильтр по категориям */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as RecipeCategoryKey | 'ALL')}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-sm"
              >
                <option value="ALL">Все категории</option>
                {Object.entries(RECIPE_CATEGORIES).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>
                    {emoji} {label}
                  </option>
                ))}
              </select>

              {/* Фильтр по времени */}
              <select
                value={selectedCookingTime}
                onChange={(e) => setSelectedCookingTime(e.target.value as 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG')}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-sm"
              >
                <option value="ALL">Любое время</option>
                <option value="SHORT">⚡ Быстрое (до 30 мин)</option>
                <option value="MEDIUM">⏱️ Среднее (30-60 мин)</option>
                <option value="LONG">🕐 Долгое (от 60 мин)</option>
              </select>

              {/* Фильтр по избранному */}
              <button
                type="button"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex-1 px-3 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  showFavoritesOnly
                    ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                <span className="text-base">{showFavoritesOnly ? '🔖' : '📑'}</span>
                <span>{showFavoritesOnly ? 'Избранные' : 'Все рецепты'}</span>
              </button>
            </div>

            {/* Результаты фильтрации */}
            {(searchQuery || selectedCategory !== 'ALL' || selectedCookingTime !== 'ALL' || showFavoritesOnly) && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Найдено: {filteredRecipes.length} из {recipes.length} рецептов
                {(searchQuery || selectedCategory !== 'ALL' || selectedCookingTime !== 'ALL' || showFavoritesOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('ALL')
                      setSelectedCookingTime('ALL')
                      setShowFavoritesOnly(false)
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Заголовок модалки */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {editingRecipe ? '✏️ Редактировать рецепт' : '+ Добавить рецепт'}
                  </h3>
                  <button
                    type="button"
                    onClick={editingRecipe ? cancelEdit : () => setShowCreateForm(false)}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Форма с прокруткой */}
                <form
                  id={editingRecipe ? 'edit-recipe-form' : 'create-recipe-form'}
                  onSubmit={editingRecipe ? updateRecipe : createRecipe}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Название рецепта *
                      </label>
                      <input
                        type="text"
                        value={newRecipe.title}
                        onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                        placeholder="Название"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Описание
                      </label>
                      <textarea
                        value={newRecipe.description}
                        onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                        placeholder="Краткое описание рецепта"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Категория
                      </label>
                      <select
                        value={newRecipe.category}
                        onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value as RecipeCategoryKey })}
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                      >
                        {Object.entries(RECIPE_CATEGORIES).map(([key, { label, emoji }]) => (
                          <option key={key} value={key}>
                            {emoji} {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Время приготовления (мин)
                        </label>
                        <input
                          type="number"
                          value={newRecipe.cookingTime}
                          onChange={(e) => setNewRecipe({ ...newRecipe, cookingTime: e.target.value })}
                          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                          placeholder="60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Количество порций
                        </label>
                        <input
                          type="number"
                          value={newRecipe.servings}
                          onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                          placeholder="4"
                        />
                      </div>
                    </div>

                    {/* Выбор ингредиентов из каталога */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Ингредиенты *
                      </label>
                      <RecipeIngredientsSelector
                        ingredients={newRecipe.ingredients}
                        onChange={(ingredients) => setNewRecipe({ ...newRecipe, ingredients })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Инструкции приготовления (опционально)
                      </label>
                      <textarea
                        value={newRecipe.instructions}
                        onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white text-base"
                        placeholder="Пошаговая инструкция..."
                        rows={6}
                      />
                    </div>
                  </div>
                </form>

                {/* Футер с кнопками - зафиксирован */}
                <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={editingRecipe ? cancelEdit : () => setShowCreateForm(false)}
                      className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      form={editingRecipe ? 'edit-recipe-form' : 'create-recipe-form'}
                      className="flex-1 px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {editingRecipe ? 'Обновить' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Список рецептов */}
        <div className="space-y-4">
          {recipes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🍳</div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Пока нет рецептов
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Добавьте свой первый рецепт!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                + Добавить рецепт
              </button>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Ничего не найдено
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const currentServings = getServingsForRecipe(recipe)
              const calculatedIngredients = calculateIngredients(recipe)
              const isCustomServings = customServings[recipe.id] !== undefined

              return (
              <div
                key={recipe.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {recipe.title}
                      </h3>
                      {recipe.isFavorite && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                      {recipe.category && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                          {RECIPE_CATEGORIES[recipe.category as RecipeCategoryKey]?.emoji} {RECIPE_CATEGORIES[recipe.category as RecipeCategoryKey]?.label}
                        </span>
                      )}
                    </div>
                    {recipe.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {recipe.cookingTime && (
                        <span className="flex items-center gap-1">
                          ⏱️ {recipe.cookingTime} мин
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        📝 {calculatedIngredients.length} ингредиент{calculatedIngredients.length > 1 ? 'ов' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="relative" ref={(el) => { dropdownRefs.current[recipe.id] = el }}>
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === recipe.id ? null : recipe.id)}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Меню"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>

                    {/* Выпадающее меню */}
                    {openDropdownId === recipe.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-2 z-50">
                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            startEdit(recipe)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-zinc-900 dark:text-zinc-50">Редактировать</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            openListSelector(recipe)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-zinc-900 dark:text-zinc-50">Добавить в список</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            toggleFavorite(recipe.id)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className="text-zinc-900 dark:text-zinc-50">
                            {recipe.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            setShareRecipe(recipe)
                            setShowShareModal(true)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="text-zinc-900 dark:text-zinc-50">Поделиться</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            exportRecipeAsText(recipe.id)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-zinc-900 dark:text-zinc-50">Скопировать рецепт</span>
                        </button>

                        <div className="border-t border-zinc-200 dark:border-zinc-700 my-2"></div>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null)
                            deleteRecipe(recipe.id)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm"
                        >
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-red-600 dark:text-red-400">Удалить рецепт</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Контроль порций */}
                {recipe.servings && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        👥 Порции: {currentServings}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newServings = Math.max(1, currentServings - 1)
                            setCustomServings(prev => ({ ...prev, [recipe.id]: newServings }))
                          }}
                          disabled={currentServings <= 1}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={currentServings}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (val >= 1 && val <= 100) {
                              setCustomServings(prev => ({ ...prev, [recipe.id]: val }))
                            }
                          }}
                          className="w-16 px-2 py-1 text-center border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newServings = Math.min(100, currentServings + 1)
                            setCustomServings(prev => ({ ...prev, [recipe.id]: newServings }))
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          +
                        </button>
                        {isCustomServings && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomServings(prev => {
                                const newState = { ...prev }
                                delete newState[recipe.id]
                                return newState
                              })
                            }}
                            className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded transition-colors"
                          >
                            Сбросить ({recipe.servings})
                          </button>
                        )}
                      </div>
                      {isCustomServings && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {currentServings > recipe.servings ? `×${(currentServings / recipe.servings).toFixed(1)} от оригинала` : `×${(currentServings / recipe.servings).toFixed(1)} от оригинала`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                      Ингредиенты
                      {isCustomServings && (
                        <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                          (на {currentServings} {currentServings < 5 ? 'порции' : 'порций'})
                        </span>
                      )}
                      :
                    </h4>
                    <ul className="space-y-1">
                      {calculatedIngredients.map((ingredient, idx) => {
                        const originalIngredient = JSON.parse(recipe.ingredients || '[]')[idx] as RecipeIngredient
                        const isQuantityChanged = originalIngredient?.quantity !== ingredient.quantity

                        return (
                        <li key={idx} className={`text-sm ${isQuantityChanged ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400'}`}>
                          • {ingredient.quantity} {ingredient.unit || 'шт'}. {ingredient.productName || ingredient.name}
                          {ingredient.productId && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">📦</span>
                          )}
                          {isQuantityChanged && (
                            <span className="ml-2 text-xs text-zinc-400">
                              (было: {originalIngredient.quantity})
                            </span>
                          )}
                        </li>
                      )})}
                    </ul>
                  </div>
                  {recipe.instructions && (
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Инструкции:</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                        {recipe.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )})
          )}
        </div>

        {/* Модалка выбора списка покупок */}
        {showListSelector && selectedRecipe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Добавить в список покупок
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Ингредиенты из рецепта &quot;<strong>{selectedRecipe.title}</strong>&quot;
              </p>

              {/* Информация о порциях */}
              {selectedRecipe.servings && customServings[selectedRecipe.id] !== undefined && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    👥 На {getServingsForRecipe(selectedRecipe)} порций
                    <span className="ml-2 text-xs">
                      (оригинал: {selectedRecipe.servings})
                    </span>
                  </p>
                </div>
              )}

              {shoppingLists.length > 0 && (
                <>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                    Выберите список или создайте новый:
                  </p>
                  <div className="space-y-2 mb-6">
                    {shoppingLists.map((list) => (
                      <label
                        key={list.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedListId === list.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shoppingList"
                          value={list.id}
                          checked={selectedListId === list.id}
                          onChange={(e) => setSelectedListId(e.target.value)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-50">
                          {list.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {shoppingLists.length > 0 && selectedListId && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  Или создайте новый список с названием &quot;{selectedRecipe.title}&quot;
                </p>
              )}

              {shoppingLists.length === 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  Будет создан новый список &quot;<strong>🛒 {selectedRecipe.title}</strong>&quot;
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowListSelector(false)
                    setSelectedRecipe(null)
                    setSelectedListId('')
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={addIngredientsToList}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {selectedListId ? 'Добавить' : 'Создать и добавить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RecipeShareModal */}
        {shareRecipe && (
          <RecipeShareModal
            recipeId={shareRecipe.id}
            recipeTitle={shareRecipe.title}
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false)
              setShareRecipe(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
