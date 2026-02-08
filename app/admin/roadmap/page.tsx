'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type RoadmapType = 'main' | 'recipes'

export default function RoadmapAdminPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  const [roadmapType, setRoadmapType] = useState<RoadmapType>('main')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/lists')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchRoadmap()
    }
  }, [isAuthenticated, user, roadmapType])

  const fetchRoadmap = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/roadmap?type=${roadmapType}`)

      if (!response.ok) {
        throw new Error('Ошибка при загрузке roadmap')
      }

      const data = await response.json()
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке roadmap')
    } finally {
      setIsLoading(false)
    }
  }

  // Парсинг markdown для красивого отображения
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inList = false
    let key = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Заголовки
      if (line.startsWith('# ')) {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        elements.push(
          <h1 key={key++} className="text-3xl font-bold text-gray-800 mt-8 mb-4">
            {line.replace('# ', '')}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        elements.push(
          <h2 key={key++} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        elements.push(
          <h3 key={key++} className="text-xl font-semibold text-gray-800 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        )
      } else if (line.startsWith('#### ')) {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        elements.push(
          <h4 key={key++} className="text-lg font-medium text-gray-800 mt-3 mb-2">
            {line.replace('#### ', '')}
          </h4>
        )
      }
      // Списки
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        if (!inList) {
          elements.push(<ul key={`ul-start-${key++}`} className="list-disc list-inside mb-2 ml-4 space-y-1" />)
          inList = true
        }
        const listItem = line.trim().replace(/^[-*] /, '')
        const formattedItem = formatMarkdownInline(listItem)
        elements.push(
          <li key={key++} className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedItem }} />
        )
      }
      // Нумерованные списки
      else if (line.match(/^\d+\.\s/)) {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        const numItem = line.replace(/^\d+\.\s/, '')
        const formattedItem = formatMarkdownInline(numItem)
        elements.push(
          <div key={key++} className="text-gray-700 ml-4 mb-1" dangerouslySetInnerHTML={{ __html: formattedItem }} />
        )
      }
      // Пустые строки
      else if (line.trim() === '') {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        elements.push(<br key={key++} />)
      }
      // Обычный текст
      else if (line.trim() !== '') {
        if (inList) {
          elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
          inList = false
        }
        const formattedLine = formatMarkdownInline(line)
        elements.push(
          <p key={key++} className="text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        )
      }
    }

    if (inList) {
      elements.push(<ul key={`ul-end-${key++}`} className="list-disc list-inside mb-4 ml-4" />)
    }

    return elements
  }

  // Форматирование inline markdown (жирный, курсив, код)
  const formatMarkdownInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/✅/g, '<span class="text-green-600">✅</span>')
      .replace(/⏳/g, '<span class="text-yellow-600">⏳</span>')
      .replace(/🔄/g, '<span class="text-blue-600">🔄</span>')
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 Roadmap</h1>
              <p className="text-gray-600">Просмотр плана разработки</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Назад
            </button>
          </div>

          {/* Toggle buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setRoadmapType('main')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roadmapType === 'main'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              📝 Основной roadmap
            </button>
            <button
              onClick={() => setRoadmapType('recipes')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roadmapType === 'recipes'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              🍳 Roadmap рецептов
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Roadmap content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-lg max-w-none">
            {renderMarkdown(content)}
          </div>
        </div>
      </div>
    </div>
  )
}
