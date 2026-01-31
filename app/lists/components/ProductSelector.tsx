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
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { formatQuantity } from "@/lib/utils/pluralize";
import { haptics } from "@/lib/utils/haptic";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  _count?: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  unit: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
  };
}

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product, quantity: number) => void;
  isItemInList: (productName: string) => boolean;
  hasOpenList: boolean;
}

export function ProductSelector({
  isOpen,
  onClose,
  onAddProduct,
  isItemInList,
  hasOpenList,
}: ProductSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Загрузка категорий при открытии
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Загрузка продуктов при выборе категории или поиске
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [selectedCategory, searchQuery, isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (response.ok) {
        const sorted = data.categories.sort(
          (a: Category, b: Category) => a.sortOrder - b.sortOrder,
        );
        setCategories(sorted);
      }
    } catch (err) {
      console.error("Ошибка загрузки категорий:", err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Ошибка загрузки продуктов:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    onAddProduct(product, quantity);
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    haptics.tap();
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  const setQuantity = (productId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, value),
    }));
  };

  const handleClose = () => {
    haptics.tap();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>🛒 Каталог продуктов</DialogTitle>
          <DialogDescription>
            Добавляйте товары из каталога в ваш список
          </DialogDescription>
        </DialogHeader>

        {/* Поиск */}
        <div className="mb-4">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory(null);
            }}
            placeholder="🔍 Поиск продуктов..."
          />
        </div>

        {/* Категории (показываем только если нет поиска) */}
        {!searchQuery && (
          <div className="max-h-[125px] overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  haptics.tap();
                  setSelectedCategory(null);
                }}
                className="w-full"
              >
                Все
              </Button>
              {categories.map((category) => {
                const displayName =
                  category.name.length > 8
                    ? category.name.slice(0, 6) + ".."
                    : category.name;

                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      haptics.tap();
                      setSelectedCategory(category.id);
                    }}
                    className="w-full truncate"
                    title={category.name}
                  >
                    {category.icon} {displayName}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Список продуктов */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!hasOpenList ? (
            <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Откройте список, чтобы добавлять товары
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Загрузка..." : "Нет продуктов"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.map((product) => {
                const isInList = isItemInList(product.name);
                const quantity = quantities[product.id] || 1;

                return (
                  <div
                    key={product.id}
                    className={`p-3 rounded-lg transition-all ${
                      isInList
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-zinc-50 dark:bg-zinc-700/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                          {product.category.icon} {product.category.name}
                        </div>
                      </div>
                      {isInList ? (
                        <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">
                          ✓
                        </span>
                      ) : null}
                    </div>

                    {/* Quantity контрол и unit */}
                    {!isInList && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, -1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              e.stopPropagation();
                              setQuantity(
                                product.id,
                                parseInt(e.target.value) || 1,
                              );
                            }}
                            onFocus={(e) =>
                              setTimeout(() => e.target.select(), 0)
                            }
                            min="1"
                            className="w-12 h-8 px-1 py-0 text-center text-sm border-0 focus:ring-0 dark:bg-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-w-[32px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, 1);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Unit */}
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 px-2 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600 flex-shrink-0 min-w-[60px] h-9 flex items-center justify-center">
                          {formatQuantity(quantity, product.unit || "шт")}
                        </div>

                        {/* Кнопка добавления */}
                        <Button
                          size="sm"
                          onClick={() => {
                            haptics.success();
                            handleAddProduct(product);
                          }}
                          className="flex-1 h-9"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Добавить
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
