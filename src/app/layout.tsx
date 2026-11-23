import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProviderWrapper } from '@/contexts/AuthProviderWrapper'
import Script from 'next/script';
import '@/styles/globals.css'
import ChunkErrorHandler from '@/components/ChunkErrorHandler';
import CacheBuster from '@/components/CacheBuster';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Flomad Travel - AI-Powered Travel Planning',
  description: 'Plan your perfect trip with AI assistance',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
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
    </head>
    <body>
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