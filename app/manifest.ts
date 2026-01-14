import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Списки покупок',
    short_name: 'Списки',
    description: 'Управление списками покупок',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#2563eb',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['productivity', 'shopping'],
    shortcuts: [
      {
        name: 'Создать список',
        short_name: 'Новый',
        description: 'Создать новый список покупок',
        url: '/?action=new',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ]
  }
}
