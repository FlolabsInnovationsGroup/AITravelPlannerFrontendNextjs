import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// App, auth and utility routes stay crawlable so crawlers can read their
// noindex meta tag; only the API and the debug page are blocked outright.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/test-auth'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
