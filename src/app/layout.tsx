import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProviderWrapper } from '@/contexts/AuthProviderWrapper'
import Script from 'next/script';
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
    <head>
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
    <body>
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