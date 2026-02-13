/**
 * Централизованный экспорт типов
 *
 * Prisma типы реэкспортируются из @prisma/client
 * Дополнительные типы для UI определены ниже
 */

import { Prisma } from '../node_modules/@prisma/client/generated'

// ========== Prisma Types (Generated) ==========
// Реэкспорт всех Prisma типов для удобства импорта
export type {
  User,
  ShoppingList,
  ListShare,
  Category,
  Product,
  Item,
  Recipe,
  Template,
  TemplateItem,
  RefreshToken,
} from '../node_modules/@prisma/client/generated'

// ========== Utility Types для Prisma ==========

// Product с relation к Category
export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true }
}>

// Item с relation к Product (с Category)
export type ItemWithProduct = Prisma.ItemGetPayload<{
  include: {
    product: {
      include: { category: true }
    }
  }
}>

// ShoppingList сrelations
export type ShoppingListWithItems = Prisma.ShoppingListGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: { category: true }
        }
      }
    }
    user: true
  }
}>

// ShoppingList с _count
export type ShoppingListWithCount = Prisma.ShoppingListGetPayload<{
  include: {
    _count: {
      select: { items: true }
    }
  }
}>

// ShoppingList для UI (минимальный набор полей)
// Note: createdAt/updatedAt are string because JSON API returns strings
export interface ShoppingListUI {
  id: string
  name: string
  createdAt: string | Date
  updatedAt: string | Date
  items?: ItemWithProduct[]
  isShared?: boolean
  isOwner?: boolean
  purchasedCount?: number
  _count?: {
    items: number
  }
  user?: {
    id: string
    username: string
    name: string | null
  }
}

// ShoppingList из API (с дополнительными полями)
export interface ShoppingListAPI extends Prisma.ShoppingListGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: { category: true }
        }
      }
    }
  }
}> {
  isShared?: boolean
  isOwner?: boolean
  purchasedCount?: number
}

// Category с _count
export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { products: true }
    }
  }
}>

// Category с products
export type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: {
    products: true
  }
}>

// Product для UI (с категорией)
export interface ProductUI {
  id: string
  name: string
  unit: string | null
  categoryId: string
  category: {
    id: string
    name: string
    icon: string | null
  }
}

// Item для UI
// Note: createdAt is string because JSON API returns strings
export interface ItemUI {
  id: string
  name: string
  quantity: number
  unit: string | null
  purchased: boolean
  createdAt: string | Date
  productId: string | null
  product?: ProductUI | null
}

// Template с relations
export type TemplateWithItems = Prisma.TemplateGetPayload<{
  include: {
    items: true
    user: {
      select: {
        id: true
        username: true
        name: true
      }
    }
  }
}>

// Recipe с relations
export type RecipeWithUser = Prisma.RecipeGetPayload<{
  include: {
    user: {
      select: {
        id: true
        username: true
        name: true
      }
    }
  }
}>

// Recipe Category маппинг (для UI)
export const RECIPE_CATEGORIES = {
  BREAKFAST: { label: 'Завтрак', emoji: '🍳' },
  LUNCH: { label: 'Обед', emoji: '🍽️' },
  DINNER: { label: 'Ужин', emoji: '🌙' },
  SNACK: { label: 'Закуска', emoji: '🥟' },
  SOUP: { label: 'Суп', emoji: '🍲' },
  SALAD: { label: 'Салат', emoji: '🥗' },
  MAIN_COURSE: { label: 'Основное', emoji: '🍖' },
  DESSERT: { label: 'Десерт', emoji: '🍰' },
  DRINK: { label: 'Напиток', emoji: '🥤' },
  BAKING: { label: 'Выпечка', emoji: '🥧' },
  PRESERVES: { label: 'Заготовки', emoji: '🥫' },
  OTHER: { label: 'Другое', emoji: '📝' },
} as const

export type RecipeCategoryKey = keyof typeof RECIPE_CATEGORIES

// User с relations (для админки)
export type UserWithLists = Prisma.UserGetPayload<{
  include: {
    shoppingLists: {
      select: {
        id: true
        name: true
        createdAt: true
        updatedAt: true
        _count: {
          select: { items: true }
        }
      }
    }
    _count: {
      select: {
        shoppingLists: true
        recipes: true
      }
    }
  }
}>

// ========== API Response Types ==========

// Ответ от GET /api/shopping-lists
export interface ShoppingListResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  purchasedCount?: number
  _count?: {
    items: number
  }
  isShared?: boolean
  isOwner?: boolean
}

// Ответ от GET /api/products
export interface ProductResponse {
  id: string
  name: string
  unit: string | null
  category: {
    id: string
    name: string
    icon: string | null
  }
}
