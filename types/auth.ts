import type { User as PrismaUser } from './index'

// Re-export Prisma User type
export type User = PrismaUser

// Дополнительные типы для авторизации (не являются дубликатами Prisma)

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
  name?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isRefreshing?: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  logoutAll?: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshTokens?: () => Promise<boolean>
  fetchWithAuth?: (url: string, options?: RequestInit) => Promise<Response>
}
