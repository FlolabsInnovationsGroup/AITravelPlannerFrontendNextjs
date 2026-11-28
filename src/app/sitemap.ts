import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Only public, indexable pages. Update a date when that page's content changes.
const pages: { path: string; lastModified: string }[] = [
  { path: '/', lastModified: '2026-02-28' },
  { path: '/about', lastModified: '2026-02-28' },
  { path: '/contact', lastModified: '2026-02-28' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, lastModified }) => ({
    url: path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`,
    lastModified: new Date(lastModified),
  }))
}
