import type { MetadataRoute } from 'next'
import { disallowedPaths, siteConfig } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowedPaths,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
