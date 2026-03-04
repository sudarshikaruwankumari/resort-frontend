// src/pages/Auth.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from '@/components/custom/LoginForm';
import RegisterForm from '@/components/custom/RegisterForm';

interface AuthProps {
  onLoginSuccess?: (token: string, username: string) => void;   // ← add this
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        {/* ... branding ... */}

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'login'
                ? 'Sign in to manage your bookings'
                : 'Join our community and book your stay'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm 
                  onSwitchToRegister={() => setActiveTab('register')} 
                  onLoginSuccess={onLoginSuccess}   // ← pass it down
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} Ocean View Resort. All rights reserved.
        </p>
      </div>
    </div>
  );
}