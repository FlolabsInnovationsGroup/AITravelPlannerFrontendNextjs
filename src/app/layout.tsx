import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProviderWrapper } from '@/components/contexts/AuthProviderWrapper';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
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
  );
}






