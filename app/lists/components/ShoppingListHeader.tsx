'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

interface ShoppingListHeaderProps {
  isCreating: boolean
  onCreateList: (name: string) => Promise<void>
}

export function ShoppingListHeader({ isCreating, onCreateList }: ShoppingListHeaderProps) {
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isCreating) return

    try {
      await onCreateList(name)
      setName('')
    } catch (err) {
      // Error обрабатывается в хуке
    }
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название нового списка"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={!name.trim() || isCreating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {isCreating ? 'Создание...' : 'Создать'}
        </button>
      </form>
    </div>
  )
}
