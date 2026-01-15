'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string
  instructions: string
  cookingTime?: number
  servings?: number
  createdAt: string
}

interface ShoppingList {
  id: string
  name: string
}

export default function RecipesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    cookingTime: '',
    servings: '',
  })

  // Для добавления в список покупок
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [showListSelector, setShowListSelector] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedListId, setSelectedListId] = useState('')

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

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/recipes', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

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

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newRecipe.title,
          description: newRecipe.description,
          ingredients: newRecipe.ingredients.split('\n').filter(i => i.trim()),
          instructions: newRecipe.instructions,
          cookingTime: newRecipe.cookingTime ? parseInt(newRecipe.cookingTime) : undefined,
          servings: newRecipe.servings ? parseInt(newRecipe.servings) : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при создании рецепта')

      setRecipes([data.recipe, ...recipes])
      setNewRecipe({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
        cookingTime: '',
        servings: '',
      })
      setShowCreateForm(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании рецепта')
    }
  }

  const deleteRecipe = async (recipeId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
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

  const fetchShoppingLists = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/shopping-lists', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

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

    const ingredients = JSON.parse(selectedRecipe.ingredients || '[]')
    let targetListId = selectedListId

    // Если список не выбран или списков нет, создаем новый
    if (!targetListId || shoppingLists.length === 0) {
      try {
        const token = localStorage.getItem('token')
        const newListName = `🛒 ${selectedRecipe.title}`

        const response = await fetch('/api/shopping-lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
      const token = localStorage.getItem('token')
      const promises = ingredients.map((ingredient: string) =>
        fetch(`/api/shopping-lists/${targetListId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: ingredient.trim(), quantity: 1 }),
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

      setError(`Добавлено ${ingredients.length} ингредиентов в список покупок!`)
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
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors text-center"
              >
                На главную
              </Link>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {showCreateForm ? 'Отмена' : '+ Добавить рецепт'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showCreateForm && (
            <form onSubmit={createRecipe} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Название рецепта *
                </label>
                <input
                  type="text"
                  value={newRecipe.title}
                  onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
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
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Краткое описание рецепта"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Время приготовления (мин)
                  </label>
                  <input
                    type="number"
                    value={newRecipe.cookingTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, cookingTime: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
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
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                    placeholder="4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Ингредиенты (каждый с новой строки)
                </label>
                <textarea
                  value={newRecipe.ingredients}
                  onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="2 яйца&#10;200г муки&#10;100мл молока"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Инструкции приготовления
                </label>
                <textarea
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-white"
                  placeholder="Пошаговая инструкция..."
                  rows={6}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Сохранить рецепт
              </button>
            </form>
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
          ) : (
            recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      {recipe.title}
                    </h3>
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
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          👥 {recipe.servings} порц.
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        📝 {JSON.parse(recipe.ingredients || '[]').length} ингредиент{JSON.parse(recipe.ingredients || '[]').length > 1 ? 'ов' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openListSelector(recipe)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Добавить в список покупок"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteRecipe(recipe.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Удалить рецепт"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Ингредиенты:</h4>
                    <ul className="space-y-1">
                      {JSON.parse(recipe.ingredients || '[]').map((ingredient: string, idx: number) => (
                        <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                          • {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Инструкции:</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                      {recipe.instructions}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Модалка выбора списка покупок */}
        {showListSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Добавить в список покупок
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Ингредиенты из рецепта &quot;<strong>{selectedRecipe?.title}</strong>&quot;
              </p>

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
                  Или создайте новый список с названием &quot;{selectedRecipe?.title}&quot;
                </p>
              )}

              {shoppingLists.length === 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  Будет создан новый список &quot;<strong>🛒 {selectedRecipe?.title}</strong>&quot;
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
      </div>
    </div>
  )
}
