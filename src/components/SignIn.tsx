import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import { signIn } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { signIn: authSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await signIn(username, password);
      if (response.status === 200) {
        authSignIn(response.data.token);
        router.push('/main');
      }
    } catch (error) {
      toast.error('Sign-in failed. Please check your credentials.');
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit">Sign In</Button>
    </form>
  );
}