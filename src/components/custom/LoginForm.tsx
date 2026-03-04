// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: (token: string, username: string) => void;
}

interface LoginData {
  username: string;
  password: string;
}

const loginUser = async (data: LoginData) => {
  const res = await fetch('http://localhost:8080/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }

  return res.json();
};

export default function LoginForm({ onSwitchToRegister, onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username }));
      toast.success('Login successful!');
      // Redirect or trigger parent re-render
      window.location.href = '/'; // or use react-router navigate
      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.username);
      }
    },
    
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid username or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          disabled={mutation.isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={mutation.isPending}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-teal-600 hover:underline font-medium"
        >
          Register here
        </button>
      </div>
    </form>
  );
}