import { prisma } from '@/lib/prisma'

/**
 * Repository для работы со списками покупок
 * Изолирует Prisma логику и упрощает тестирование
 */
export class ShoppingListRepository {
  /**
   * Найти список по ID с базовыми полями
   */
  async findById(id: string) {
    return prisma.shoppingList.findUnique({
      where: { id },
    })
  }

  /**
   * Найти список по ID с товарами (для детального просмотра)
   */
  async findByIdWithItems(id: string) {
    return prisma.shoppingList.findFirst({
      where: {
        id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * Найти список по ID с проверкой доступа (владелец или shared)
   */
  async findByIdWithAccess(id: string, userId: string) {
    return prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    })
  }

  /**
   * Найти список по ID с товарами и проверкой доступа
   */
  async findByIdWithItemsAndAccess(id: string, userId: string) {
    return prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * Найти все списки пользователя (только свои)
   */
  async findByUser(userId: string) {
    return prisma.shoppingList.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Найти все доступные списки (свои + shared)
   */
  async findAccessibleByUser(userId: string) {
    // Свои списки
    const ownLists = await prisma.shoppingList.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true,
            shares: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Shared списки
    const sharedLists = await prisma.shoppingList.findMany({
      where: {
        shares: {
          some: { userId }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        shares: {
          where: { userId },
          select: {
            id: true,
            createdAt: true
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return { ownLists, sharedLists }
  }

  /**
   * Проверить, имеет ли пользователь доступ к списку
   */
  async checkAccess(listId: string, userId: string): Promise<boolean> {
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    })
    return !!list
  }

  /**
   * Проверить, является ли пользователь владельцем списка
   */
  async isOwner(listId: string, userId: string): Promise<boolean> {
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      select: { userId: true }
    })
    return list?.userId === userId
  }

  /**
   * Создать новый список
   */
  async create(data: { name: string; userId: string }) {
    return prisma.shoppingList.create({
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { items: true }
        }
      }
    })
  }

  /**
   * Обновить список
   */
  async update(id: string, data: { name?: string }) {
    return prisma.shoppingList.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        items: true
      }
    })
  }

  /**
   * Удалить список
   */
  async delete(id: string) {
    return prisma.shoppingList.delete({
      where: { id }
    })
  }

  /**
   * Найти списки, которые принадлежат пользователю
   */
  async findOwnerList(listId: string, userId: string) {
    return prisma.shoppingList.findFirst({
      where: { id: listId, userId }
    })
  }

  /**
   * Получить количество купленных товаров для списков
   */
  async getPurchasedCountMap(listIds: string[]): Promise<Record<string, number>> {
    const purchasedCounts = await prisma.item.groupBy({
      by: ['listId'],
      where: {
        listId: { in: listIds },
        purchased: true
      },
      _count: { listId: true }
    })

    return Object.fromEntries(
      purchasedCounts.map(item => [item.listId, item._count.listId])
    )
  }

  /**
   * Получить количество товаров для списков
   */
  async getItemsCountMap(listIds: string[]): Promise<Record<string, number>> {
    const itemsCount = await prisma.item.groupBy({
      by: ['listId'],
      where: {
        listId: { in: listIds }
      },
      _count: { listId: true }
    })

    return Object.fromEntries(
      itemsCount.map(item => [item.listId, item._count.listId])
    )
  }
}

/**
 * Экспорт синглтона
 */
export const shoppingListRepository = new ShoppingListRepository()
