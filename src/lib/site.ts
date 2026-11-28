// Canonical site identity used by metadata, robots.txt, sitemap.xml and JSON-LD.
export const SITE_URL = 'https://www.flomadtravel.com'
export const SITE_NAME = 'Flomad Travel'
export const SITE_TITLE = 'Flomad Travel - AI-Powered Travel Planning'
export const SITE_DESCRIPTION =
  'Plan your perfect trip with AI assistance. Flomad Travel builds personalized itineraries with accommodations, flights and experiences tailored to you.'
export const SITE_TAGLINE = 'Explore your way, all the way.'
export const LINKEDIN_URL = 'https://www.linkedin.com/company/flomad-labs-r-d/'

/**
 * Open Graph / Twitter fields for a page that sets its own title. A page-level
 * openGraph object replaces the inherited one, so the share image is repeated here.
 */
export function socialMetadata(path: string, title: string, description: string) {
  return {
    openGraph: {
      type: 'website' as const,
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title,
      description,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: SITE_TITLE }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [{ url: '/twitter-image', width: 1200, height: 630, alt: SITE_TITLE }],
    },
  }
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Serialize JSON-LD safely for a <script type="application/ld+json"> tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
