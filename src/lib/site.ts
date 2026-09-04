export const siteConfig = {
  name: 'Flomad Travel',
  description: 'Plan your perfect trip with AI assistance',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.flomadtravel.com',
} as const

export const publicRoutes = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
] as const

export const disallowedPaths = [
  '/api/',
  '/auth/',
  '/chat/',
  '/test-auth/',
  '/signin',
  '/signup',
  '/forgot-password',
]
