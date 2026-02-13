import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Оптимизация для Docker
  turbopack: {}, // Пустая конфигурация для Turbopack
};

export default withPWA({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: false, // Всегда включен (development + production)
  // Стратегия кеширования для статических файлов
  runtimeCaching: [
    // API запросы - NetworkFirst с офлайн fallback
    {
      urlPattern: /^https?.*/, // Исправлен regex (убран лишний слеш)
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 часа
        },
      },
    },
    // Статические файлы Next.js - CacheFirst (быстрее)
    {
      urlPattern: /\/_next\/static\/.+/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
        },
      },
    },
    // Изображения
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        },
      },
    },
  ],
})(nextConfig);
