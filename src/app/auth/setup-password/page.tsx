"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MainLayout } from '@/components/layout/main-layout-simple';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (!token || !email) {
      router.push('/auth/login');
      return;
    }
    setUserEmail(email);
  }, [token, email, router]);

  const onSubmit = async (data: PasswordFormData) => {
    if (!token || !email) {
      setError('Invalid setup link. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the user's password
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set password');
      }

      // Automatically sign in the user with the new password
      const signInResult = await signIn('credentials', {
        email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Password set successfully, but auto-login failed. Please login manually.');
      }

      // Get order ID from URL to redirect to success page
      const orderId = searchParams.get('orderId');
      
      if (orderId) {
        // Redirect to order success page with welcome message
        router.push(`/order/success?orderId=${orderId}&welcome=true`);
      } else {
        // Redirect to account dashboard
        router.push('/account?welcome=true');
      }
    } catch (error) {
      console.error('Setup password error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Setup Link</h1>
            <p className="text-muted-foreground mb-6">
              This password setup link is invalid or has expired.
            </p>
            <Button asChild>
              <a href="/auth/login">Go to Login</a>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold">Set Your Password</h1>
            <p className="text-muted-foreground">
              Welcome! Your account has been created for <strong>{userEmail}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Please set a secure password to complete your account setup.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Your Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your new password"
                              className="h-12 text-base pr-12"
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="h-12 text-base pr-12"
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Setting Password...' : 'Set Password & Continue'}
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    <p>Password requirement: At least 6 characters</p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
