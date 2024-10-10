'use client';

import { AuthProvider } from '@/components/AuthContext';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}