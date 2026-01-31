'use client'

import { GroupedShoppingListCard } from './GroupedShoppingListCard'
import { ShoppingList, Category } from '@/types'

interface ListsContentProps {
  filteredShoppingLists: ShoppingList[]
  shoppingLists: ShoppingList[]
  expandedListId: string | null
  setExpandedListId: (id: string | null) => void
  deleteList: (id: string) => void
  addItem: (listId: string, name: string) => Promise<void>
  updateItem: (listId: string, itemId: string, updates: any) => Promise<void>
  toggleItem: (listId: string, itemId: string) => Promise<void>
  deleteItem: (listId: string, itemId: string) => Promise<void>
  deselectAll: (listId: string) => Promise<void>
  newItemNames: Record<string, string>
  setNewItemNames: (names: Record<string, string>) => void
  categories: Category[]
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string | null) => void
  isDeletingList: Record<string, boolean>
  isAddingItem: Record<string, boolean>
  isUpdatingItem: Record<string, boolean>
  isTogglingItem: Record<string, boolean>
  isDeletingItem: Record<string, Record<string, boolean>>
  onShare: (id: string) => void
  onSaveAsTemplate: (id: string) => void
}

export function ListsContent({
  filteredShoppingLists,
  shoppingLists,
  expandedListId,
  setExpandedListId,
  deleteList,
  addItem,
  updateItem,
  toggleItem,
  deleteItem,
  deselectAll,
  newItemNames,
  setNewItemNames,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  isDeletingList,
  isAddingItem,
  isUpdatingItem,
  isTogglingItem,
  isDeletingItem,
  onShare,
  onSaveAsTemplate
}: ListsContentProps) {
  return (
    <>
      {filteredShoppingLists.length === 0 && shoppingLists.length > 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="text-5xl md:text-6xl mb-4">🔍</div>
          <h2 className="text-xl md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Ничего не найдено
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base">
            Попробуйте изменить параметры поиска или фильтры
          </p>
        </div>
      ) : (
        filteredShoppingLists.map((list) => (
          <GroupedShoppingListCard
            key={list.id}
            list={list}
            isExpanded={expandedListId === list.id}
            onToggle={(id) => setExpandedListId(expandedListId === id ? null : id)}
            onDelete={deleteList}
            onShare={list.isOwner ? onShare : undefined}
            onSaveAsTemplate={list.isOwner ? onSaveAsTemplate : undefined}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onToggleItem={toggleItem}
            onDeleteItem={deleteItem}
            onDeselectAll={deselectAll}
            newItemName={newItemNames[list.id] || ''}
            onItemNameChange={(id, name) =>
              setNewItemNames({ ...newItemNames, [id]: name })
            }
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            isDeleting={isDeletingList[list.id]}
            isAddingItem={isAddingItem[list.id]}
            isUpdatingItem={isUpdatingItem}
            isTogglingItem={isTogglingItem}
            isDeletingItem={isDeletingItem[list.id] || {}}
          />
        ))
      )}
    </>
  )
}
