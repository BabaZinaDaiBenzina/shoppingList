'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 sm:p-12 text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  Shopping List
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Управляйте списками покупок и рецептами вместе с друзьями
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-lg"
              >
                Войти в аккаунт
              </Link>
              <Link
                href="/register"
                className="block w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors text-lg"
              >
                Зарегистрироваться
              </Link>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Возможности:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4">
                  <div className="text-2xl mb-2">🛒</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">Списки покупок</div>
                  <div className="text-zinc-600 dark:text-zinc-400 mt-1">Создавайте и делитесь списками</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📖</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">Рецепты</div>
                  <div className="text-zinc-600 dark:text-zinc-400 mt-1">Сохраняйте любимые рецепты</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <span className="text-4xl font-bold text-white">
              {user?.name?.[0] || user?.username?.[0].toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Добро пожаловать, {user?.name || user?.username}!
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Что хотите сделать сегодня?
            </p>
          </div>
        </div>

        {/* Карточки выбора */}
        <div className={`grid gap-6 ${user?.role === 'admin' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Админ-панель (только для администраторов) */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-red-500 dark:hover:border-red-400"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-4xl">⚙️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                    Панель администратора
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Управление пользователями и списками покупок
                  </p>
                </div>
                <div className="pt-4">
                  <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-medium group-hover:gap-3 transition-all">
                    Перейти к панели
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          )}
          {/* Списки покупок */}
          <Link
            href="/lists"
            className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-4xl">🛒</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  Списки покупок
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Создавайте списки, добавляйте товары и делитесь с друзьями
                </p>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 transition-all">
                  Перейти к спискам
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Рецепты */}
          <Link
            href="/recipes"
            className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-4xl">📖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  Рецепты
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Сохраняйте любимые рецепты и создавайте меню
                </p>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium group-hover:gap-3 transition-all">
                  Перейти к рецептам
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Профиль и выход */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href={`/user/${user?.id}`}
            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors text-center"
          >
            Мой профиль
          </Link>
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
