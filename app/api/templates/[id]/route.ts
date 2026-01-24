import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/templates/[id] - Получить шаблон по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа (свой или публичный)
    if (template.userId !== userId && !template.isPublic) {
      return NextResponse.json(
        { error: 'Нет доступа к шаблону' },
        { status: 403 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении шаблона' },
      { status: 500 }
    )
  }
}

// PATCH /api/templates/[id] - Обновить шаблон
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params
    // Проверяем существование шаблона и права
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    if (existingTemplate.userId !== userId) {
      return NextResponse.json(
        { error: 'Можно редактировать только свои шаблоны' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, isPublic } = body

    // Обновляем шаблон
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении шаблона' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Удалить шаблон
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params
    // Проверяем существование шаблона и права
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    if (existingTemplate.userId !== userId) {
      return NextResponse.json(
        { error: 'Можно удалять только свои шаблоны' },
        { status: 403 }
      )
    }

    // Удаляем шаблон (каскадно удалятся и TemplateItem)
    await prisma.template.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении шаблона' },
      { status: 500 }
    )
  }
}
