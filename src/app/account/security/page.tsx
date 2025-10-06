"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const createPasswordSchema = (t: any, hasPassword: boolean) => {
  if (hasPassword) {
    // Change password schema (requires current password)
    return z.object({
      currentPassword: z.string().min(1, t('security.currentPasswordRequired')),
      newPassword: z.string().min(1, t('security.newPasswordRequired')),
      confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: t('security.passwordsDontMatch'),
      path: ["confirmPassword"],
    });
  } else {
    // Set password schema (no current password needed)
    return z.object({
      newPassword: z.string().min(1, t('security.newPasswordRequired')),
      confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: t('security.passwordsDontMatch'),
      path: ["confirmPassword"],
    });
  }
};

type PasswordForm = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SecurityPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordSchema = createPasswordSchema(t, hasPassword ?? true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Check if user has a password set
  useEffect(() => {
    const checkUserPassword = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          // We'll add a hasPassword field to the profile API response
          setHasPassword(userData.hasPassword ?? true);
        }
      } catch (error) {
        console.error('Error checking user password status:', error);
        setHasPassword(true); // Default to assuming they have a password
      }
    };

    checkUserPassword();
  }, [session]);

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      let response;
      
      if (hasPassword) {
        // Change existing password
        response = await fetch('/api/user/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        });
      } else {
        // Set new password (for OAuth users)
        response = await fetch('/api/user/set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newPassword: data.newPassword,
          }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        const successMessage = hasPassword 
          ? t('security.passwordChangedSuccess') 
          : t('security.passwordSetSuccess');
        
        toast.success(successMessage);
        reset();
        // Update hasPassword state if we just set a password
        if (!hasPassword) {
          setHasPassword(true);
        }
      } else {
        // Handle specific error codes with translated messages
        let errorMessage = t('security.passwordChangeFailed'); // Default fallback
        
        if (result.error) {
          switch (result.error) {
            case 'incorrect_password':
              errorMessage = t('security.incorrectCurrentPassword');
              break;
            case 'no_password_set':
              errorMessage = t('security.noPasswordSet');
              break;
            case 'password_already_exists':
              errorMessage = t('security.passwordAlreadyExists');
              break;
            case 'user_not_found':
              errorMessage = t('security.userNotFound');
              break;
            case 'validation_error':
              errorMessage = t('security.validationError');
              break;
            case 'server_error':
              errorMessage = t('security.serverError');
              break;
            default:
              errorMessage = result.message || t('security.passwordChangeFailed');
          }
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Password operation error:', error);
      toast.error(t('security.passwordChangeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('security.confirmDeleteAccount'))) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t('security.accountDeletedSuccess'));
        // Sign out and redirect to home
        await signOut({ callbackUrl: '/' });
      } else {
        toast.error(result.error || t('security.accountDeleteFailed'));
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(t('security.accountDeleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t('security.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('security.description')}
          </p>
        </div>

        {/* Security Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('security.overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{t('security.passwordProtected')}</p>
                  <p className="text-sm text-muted-foreground">{t('security.passwordProtectedDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{t('security.emailVerified')}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change/Set Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {hasPassword ? t('security.changePassword') : t('security.setPassword')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPassword === null ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">{t('common.loading')}</div>
              </div>
            ) : (
              <>
                {!hasPassword && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {t('security.noPasswordInfo')}
                    </p>
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                {hasPassword && (
                  <div>
                    <Label htmlFor="currentPassword">{t('security.currentPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        {...register('currentPassword')}
                        className={errors.currentPassword ? 'border-destructive' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                )}

              <div>
                <Label htmlFor="newPassword">{t('security.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('security.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Key className="h-4 w-4 mr-2" />
                    {isLoading 
                      ? hasPassword 
                        ? t('security.changing')
                        : t('security.setting')
                      : hasPassword 
                        ? t('security.changePassword') 
                        : t('security.setPassword')
                    }
                  </Button>
                </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t('security.deleteAccount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                <div>
                  <p className="font-medium text-destructive">{t('security.deleteAccount')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('security.deleteAccountDescription')}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? t('security.deleting') : t('security.deleteAccount')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}














