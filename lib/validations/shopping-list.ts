import { z } from 'zod'

/**
 * Схема для создания списка покупок
 */
export const createShoppingListSchema = z.object({
  name: z.string()
    .min(1, 'Название списка обязательно')
    .max(100, 'Максимальная длина названия 100 символов')
    .trim(),
})

/**
 * Схема для обновления списка покупок
 */
export const updateShoppingListSchema = z.object({
  name: z.string()
    .min(1, 'Название списка обязательно')
    .max(100, 'Максимальная длина названия 100 символов')
    .trim(),
})

/**
 * Схема для создания товара в списке
 */
export const createItemSchema = z.object({
  name: z.string()
    .min(1, 'Название товара обязательно')
    .max(200, 'Максимальная длина названия 200 символов')
    .trim(),
  quantity: z.number()
    .int('Количество должно быть целым числом')
    .positive('Количество должно быть положительным')
    .default(1),
  unit: z.string()
    .max(20, 'Максимальная длина единицы измерения 20 символов')
    .nullable()
    .optional(),
  productId: z.string()
    .cuid('Неверный формат ID продукта')
    .nullable()
    .optional(),
  categoryId: z.string()
    .cuid('Неверный формат ID категории')
    .nullable()
    .optional(),
})

/**
 * Схема для обновления товара
 */
export const updateItemSchema = z.object({
  name: z.string()
    .min(1, 'Название товара обязательно')
    .max(200, 'Максимальная длина названия 200 символов')
    .trim()
    .optional(),
  quantity: z.number()
    .int('Количество должно быть целым числом')
    .positive('Количество должно быть положительным')
    .optional(),
  unit: z.string()
    .max(20, 'Максимальная длина единицы измерения 20 символов')
    .nullable()
    .optional(),
  purchased: z.boolean().optional(),
})

/**
 * Типы из схем
 */
export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>
export type UpdateShoppingListInput = z.infer<typeof updateShoppingListSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
