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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 sm:p-12">
          {isAuthenticated && user ? (
            // Авторизованный пользователь
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-white">
                  {user.name?.[0] || user.username[0].toUpperCase()}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  Добро пожаловать, {user.name || user.username}!
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {user.email}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4 text-left">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Ваша информация:</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Логин:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Email:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Зарегистрирован:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link
                  href="/lists"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Мои списки 🛒
                </Link>
                <button
                  onClick={logout}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            // Неавторизованный пользователь
            <div className="text-center space-y-8">
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
                    Управляйте списками покупок вместе с друзьями
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">Создавайте списки</div>
                    <div className="text-zinc-600 dark:text-zinc-400 mt-1">Множество списков для разных целей</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">Делитесь</div>
                    <div className="text-zinc-600 dark:text-zinc-400 mt-1">Совместное редактирование</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">Отмечайте</div>
                    <div className="text-zinc-600 dark:text-zinc-400 mt-1">Что уже куплено</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
