'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function GoogleCallback() {
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      window.location.href = '/auth/signin';
    } else if (token) {
      signIn(token);
      
    } else {
      window.location.href = '/auth/signin';
    }
  }, [searchParams, signIn]);

  return <div>Processing authentication...</div>;
}