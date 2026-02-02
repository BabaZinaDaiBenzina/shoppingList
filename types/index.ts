export interface Product {
  id: string
  name: string
  unit: string | null
  category: {
    id: string
    name: string
    icon: string | null
  }
}

export interface Item {
  id: string
  name: string
  quantity: number
  unit: string | null
  purchased: boolean
  createdAt: string
  product?: Product | null
}

export interface ShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: Item[]
  isShared?: boolean
  isOwner?: boolean
  purchasedCount?: number
  user?: {
    id: string
    username: string
    name: string | null
  }
  _count?: {
    items: number
  }
}

export interface Category {
  id: string
  name: string
  icon: string | null
}
