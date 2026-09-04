import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProviderWrapper } from '@/contexts/AuthProviderWrapper'
import Script from 'next/script';
import '@/styles/globals.css'
import ChunkErrorHandler from '@/components/ChunkErrorHandler';
import CacheBuster from '@/components/CacheBuster';
import { siteConfig } from '@/lib/site';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: 'Flomad Travel - AI-Powered Travel Planning',
  description: siteConfig.description,
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
  verification: {
    google: 'OZxib-fzrkMhwBQ0D82UHlZXXwM2o9X5ki2aTx0Lkys',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
    <head>
      {/* Force browser cache invalidation */}
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-0C5MC328H4"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0C5MC328H4');
          `}
      </Script>

      {/* Google Tag Manager */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-KJR42NKX');`}
      </Script>
    </head>
    <body>
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-KJR42NKX"
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
    <CacheBuster />
    <ChunkErrorHandler />
    <AuthProviderWrapper>
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Analytics />
          </ThemeProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  )
}