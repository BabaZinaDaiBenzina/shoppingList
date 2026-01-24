"use client";

import { useState, useEffect } from "react";
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
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch("/api/categories");

      const data = await response.json();
      if (response.ok) {
        // Сортируем по sortOrder
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
      // Cookie автоматически отправляется браузером (httpOnly)
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
    // Сбрасываем количество после добавления
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const updateQuantity = (productId: string, delta: number) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center pt-4 sm:pt-0">
      <div className="bg-white dark:bg-zinc-800 w-full sm:max-w-2xl sm:rounded-2xl sm:relative sm:max-h-[90vh] max-h-[calc(100vh-2rem)] sm:h-auto rounded-2xl sm:rounded-t-2xl overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              🛒 Каталог продуктов
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <svg
                className="w-6 h-6 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Поиск */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null); // Сбросить категорию при поиске
              }}
              placeholder="🔍 Поиск продуктов..."
              className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Категории (показываем только если нет поиска) - сетка с прокруткой */}
          {!searchQuery && (
            <div className="max-h-[125px] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${
                    selectedCategory === null
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                  }`}
                >
                  Все
                </button>
                {categories.map((category) => {
                  const displayName =
                    category.name.length > 8
                      ? category.name.slice(0, 6) + ".."
                      : category.name;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center truncate ${
                        selectedCategory === category.id
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                      }`}
                      title={category.name}
                    >
                      {category.icon} {displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Список продуктов */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptics.tap();
                              updateQuantity(product.id, -1);
                            }}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-l-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <input
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
                            className="w-12 px-1 py-2 text-center text-sm border-0 focus:outline-none focus:ring-0 dark:bg-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptics.tap();
                              updateQuantity(product.id, 1);
                            }}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-r-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Unit или дефолтный */}
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 px-2 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600 flex-shrink-0 min-w-[60px] min-h-[44px] flex items-center justify-center">
                          {formatQuantity(quantity, product.unit || "шт")}
                        </div>

                        {/* Кнопка добавления */}
                        <button
                          onClick={() => {
                            haptics.success();
                            handleAddProduct(product);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors active:scale-95 min-h-[44px] flex items-center justify-center"
                        >
                          Добавить
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
