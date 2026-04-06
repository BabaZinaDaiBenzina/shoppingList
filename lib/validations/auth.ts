import { z } from 'zod'

/**
 * Схема для регистрации
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Некорректный email адрес')
    .min(5, 'Email слишком короткий')
    .max(255, 'Email слишком длинный')
    .toLowerCase()
    .trim(),
  username: z.string()
    .min(3, 'Username должен содержать минимум 3 символа')
    .max(30, 'Максимальная длина username 30 символов')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username может содержать только буквы, цифры, дефис и подчеркивание')
    .trim(),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(100, 'Пароль слишком длинный'),
  name: z.string()
    .max(100, 'Максимальная длина имени 100 символов')
    .optional(),
})

/**
 * Схема для входа
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Некорректный email адрес')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Пароль обязателен'),
})

/**
 * Схема для смены пароля
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Текущий пароль обязателен'),
  newPassword: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(100, 'Пароль слишком длинный'),
})

/**
 * Типы из схем
 */
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
