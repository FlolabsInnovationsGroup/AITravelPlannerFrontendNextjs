import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProviderWrapper } from '@/contexts/AuthProviderWrapper'
import Script from 'next/script';
import '@/styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      {/* Google Fonts fallback - load via link for better reliability */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" 
        rel="stylesheet"
      />
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-0C5MC328H4`}
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
    <body style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
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