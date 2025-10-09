"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout-simple';

export default function AuthDebugPage() {
  const { data: session, status, update } = useSession();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginResult, setLoginResult] = useState<string>('');

  const handleLogin = async () => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginResult(`Login failed: ${result.error}`);
      } else if (result?.ok) {
        setLoginResult('Login successful!');
        // Force session update
        await update();
      } else {
        setLoginResult('Login failed: Unknown error');
      }
    } catch (error) {
      setLoginResult(`Login error: ${error}`);
    }
  };

  const testAuthAPI = async () => {
    try {
      const response = await fetch('/api/debug/auth');
      const result = await response.json();
      setLoginResult(`Auth API: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setLoginResult(`Auth API error: ${error}`);
    }
  };

  const testOrderAPI = async () => {
    try {
      const response = await fetch('/api/orders');
      const result = await response.json();
      if (response.ok) {
        setLoginResult(`Orders API: Success - ${result.orders?.length || 0} orders`);
      } else {
        setLoginResult(`Orders API: Error - ${result.error}`);
      }
    } catch (error) {
      setLoginResult(`Orders API error: ${error}`);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔐 Mobile Authentication Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Session Status */}
              <div className="space-y-2">
                <h3 className="font-semibold">Session Status:</h3>
                <pre className="text-xs bg-muted p-3 rounded">
                  Status: {status}
                  {session && `
User: ${session.user?.email}
ID: ${session.user?.id}
Role: ${session.user?.role}`}
                </pre>
              </div>

              {/* Quick Login Form */}
              {status !== 'authenticated' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Login:</h3>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12"
                  />
                  <Button onClick={handleLogin} className="w-full h-12">
                    Login
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button onClick={testAuthAPI} variant="outline" className="h-12">
                  Test Auth API
                </Button>
                <Button onClick={testOrderAPI} variant="outline" className="h-12">
                  Test Orders API
                </Button>
                {status === 'authenticated' && (
                  <Button onClick={() => signOut()} variant="destructive" className="h-12">
                    Sign Out
                  </Button>
                )}
              </div>

              {/* Results */}
              {loginResult && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Result:</h3>
                  <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
                    {loginResult}
                  </pre>
                </div>
              )}

              {/* Device Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">Device Info:</h3>
                <pre className="text-xs bg-muted p-3 rounded">
{`User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
Is Mobile: ${typeof navigator !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'N/A'}
Cookies Enabled: ${typeof navigator !== 'undefined' ? navigator.cookieEnabled : 'N/A'}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

