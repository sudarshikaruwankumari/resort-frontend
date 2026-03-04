// src/components/auth/RegisterForm.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const registerUser = async (data: RegisterData) => {
  const res = await fetch('http://localhost:8080/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Registration failed');
  }

  return res.json();
};

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success('Registration successful! Please sign in.');
      onSwitchToLogin();
      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          disabled={mutation.isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
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
        {mutation.isPending ? 'Creating account...' : 'Create Account'}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-teal-600 hover:underline font-medium"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}