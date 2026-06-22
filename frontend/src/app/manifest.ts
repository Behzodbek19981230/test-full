import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Test Market — DTM va Attestatsiyaga Tayyorlanish',
    short_name: 'Test Market',
    description: "DTM va attestatsiya uchun barcha fanlar bo'yicha professional testlar platformasi",
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e1a',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
