"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Edit, Trash2 } from "lucide-react";
import { haptics } from "@/lib/utils/haptic";
import type { CategoryWithProducts, Product } from "@/types";

interface ProductManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductManager({ isOpen, onClose }: ProductManagerProps) {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Forms
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithProducts | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "",
    sortOrder: 0,
  });
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    unit: "",
  });

  // Загрузка категорий при открытии
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/categories/admin");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      } else {
        setError(data.error || "Ошибка загрузки");
      }
    } catch {
      setError("Ошибка загрузки категорий");
    } finally {
      setIsLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", icon: "", sortOrder: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetProductForm = () => {
    setProductForm({ name: "", categoryId: "", unit: "" });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const startEditCategory = (category: CategoryWithProducts) => {
    haptics.tap();
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon || "",
      sortOrder: category.sortOrder,
    });
    setShowCategoryForm(true);
    setShowProductForm(false);
  };

  const startEditProduct = (product: Product) => {
    haptics.tap();
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      categoryId: product.categoryId,
      unit: product.unit || "",
    });
    setShowProductForm(true);
    setShowCategoryForm(false);
  };

  const startAddProduct = (categoryId: string) => {
    haptics.tap();
    setEditingProduct(null);
    setProductForm({ name: "", categoryId, unit: "" });
    setShowProductForm(true);
    setShowCategoryForm(false);
  };

  const saveCategory = async () => {
    setError("");
    try {
      const url = editingCategory
        ? `/api/categories/admin/${editingCategory.id}`
        : "/api/categories/admin";

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      haptics.success();
      await fetchCategories();
      resetCategoryForm();
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    haptics.tap();
    if (!confirm("Вы уверены, что хотите удалить категорию?")) return;

    setError("");
    try {
      const response = await fetch(`/api/categories/admin/${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка удаления");
      }

      haptics.success();
      await fetchCategories();
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const saveProduct = async () => {
    setError("");
    try {
      const url = editingProduct
        ? `/api/products/admin/${editingProduct.id}`
        : "/api/products/admin";

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      haptics.success();
      await fetchCategories();
      resetProductForm();
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const deleteProduct = async (productId: string) => {
    haptics.tap();
    if (!confirm("Вы уверены, что хотите удалить продукт?")) return;

    setError("");
    try {
      const response = await fetch(`/api/products/admin/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка удаления");
      }

      haptics.success();
      await fetchCategories();
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const handleClose = () => {
    haptics.tap();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>📦 Управление каталогом</DialogTitle>
          <DialogDescription>
            Добавляйте и редактируйте категории и продукты
          </DialogDescription>
        </DialogHeader>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Кнопка добавления категории */}
        {!showCategoryForm && !showProductForm && (
          <Button
            onClick={() => {
              haptics.tap();
              resetCategoryForm();
              setShowCategoryForm(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Добавить категорию
          </Button>
        )}

        {/* Форма категории */}
        {showCategoryForm && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
            <h3 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
              {editingCategory ? "Редактировать категорию" : "Новая категория"}
            </h3>
            <div className="space-y-3">
              <Input
                type="text"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Название категории"
              />
              <Input
                type="text"
                value={categoryForm.icon}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, icon: e.target.value })
                }
                placeholder="Emoji (например: 🥩)"
              />
              <div className="flex gap-2">
                <Button onClick={saveCategory} className="flex-1">
                  Сохранить
                </Button>
                <Button onClick={resetCategoryForm} variant="outline">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Форма продукта */}
        {showProductForm && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
            <h3 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
              {editingProduct ? "Редактировать продукт" : "Новый продукт"}
            </h3>
            <div className="space-y-3">
              {/* Сетка категорий */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Категория
                </label>
                <div className="max-h-[140px] overflow-y-auto">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          setProductForm({
                            ...productForm,
                            categoryId: cat.id,
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1 ${
                          productForm.categoryId === cat.id
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                        }`}
                        title={cat.name}
                      >
                        <span className="text-xl leading-none">{cat.icon}</span>
                        <span className="text-xs leading-tight truncate w-full text-center">
                          {cat.name.length > 8
                            ? cat.name.slice(0, 6) + ".."
                            : cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {productForm.categoryId === "" && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    Выберите категорию
                  </p>
                )}
              </div>

              <Input
                type="text"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                placeholder="Название продукта"
              />
              <Input
                type="text"
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit: e.target.value })
                }
                placeholder="Единица измерения (шт, кг, л, г...)"
              />
              <div className="flex gap-2">
                <Button
                  onClick={saveProduct}
                  disabled={!productForm.categoryId || !productForm.name.trim()}
                  className="flex-1"
                >
                  Сохранить
                </Button>
                <Button onClick={resetProductForm} variant="outline">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Список категорий и продуктов */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Загрузка...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              Нет категорий. Создайте первую!
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  {/* Заголовок категории */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {category.name}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        [{category.products?.length || 0}]
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startAddProduct(category.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Добавить продукт"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditCategory(category)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Продукты категории */}
                  {category.products && category.products.length > 0 && (
                    <div className="p-4 space-y-2">
                      {category.products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                {product.name}
                              </div>
                              {product.unit && (
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {product.unit.toLowerCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditProduct(product)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
