import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ShoppingListUI, Category } from '@/types'

interface ShoppingListsState {
  lists: ShoppingListUI[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  categories: Category[]
  activeTab: 'all' | 'mine' | 'shared'
  searchQuery: string
  categoryFilter: string | null
  statusFilter: 'all' | 'purchased' | 'unpurchased'
  sortBy: 'name' | 'date'
  expandedListId: string | null
}

interface ShoppingListsActions {
  setLists: (lists: ShoppingListUI[]) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setError: (error: string | null) => void
  setCategories: (categories: Category[]) => void
  setActiveTab: (tab: 'all' | 'mine' | 'shared') => void
  setSearchQuery: (query: string) => void
  setCategoryFilter: (categoryId: string | null) => void
  setStatusFilter: (filter: 'all' | 'purchased' | 'unpurchased') => void
  setSortBy: (sortBy: 'name' | 'date') => void
  setExpandedListId: (listId: string | null) => void
  updateList: (listId: string, updates: Partial<ShoppingListUI>) => void
  removeList: (listId: string) => void
  resetFilters: () => void
}

type ShoppingListsStore = ShoppingListsState & ShoppingListsActions

export const useShoppingListsStore = create<ShoppingListsStore>()(
  devtools(
    (set) => ({
      // Initial state
      lists: [],
      isLoading: true,
      isRefreshing: false,
      error: null,
      categories: [],
      activeTab: 'all',
      searchQuery: '',
      categoryFilter: null,
      statusFilter: 'all',
      sortBy: 'date',
      expandedListId: null,

      // Actions
      setLists: (lists) => set({ lists }),
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      setError: (error) => set({ error }),
      setCategories: (categories) => set({ categories }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSortBy: (sortBy) => set({ sortBy }),
      setExpandedListId: (expandedListId) => set({ expandedListId }),

      updateList: (listId, updates) =>
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, ...updates } : list
          ),
        })),

      removeList: (listId) =>
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== listId),
        })),

      resetFilters: () =>
        set({
          searchQuery: '',
          categoryFilter: null,
          statusFilter: 'all',
          sortBy: 'date',
        }),
    }),
    {
      name: 'shopping-lists-store',
    }
  )
)
