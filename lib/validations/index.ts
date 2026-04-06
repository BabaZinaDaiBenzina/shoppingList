/**
 * Централизованный экспорт всех схем валидации
 */

export {
  createShoppingListSchema,
  updateShoppingListSchema,
  createItemSchema,
  updateItemSchema,
  type CreateShoppingListInput,
  type UpdateShoppingListInput,
  type CreateItemInput,
  type UpdateItemInput,
} from './shopping-list'

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
} from './auth'
