"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  User,
  Bell,
  Globe,
  Palette,
  Upload,
  Save,
  Mail,
  Smartphone,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const createProfileSchema = (t: any) => z.object({
  name: z.string().min(1, t('settings.nameRequired')),
  email: z.string().email(t('settings.invalidEmail')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().optional(),
});

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  newsletter: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  currency: z.string(),
  timezone: z.string(),
});

type ProfileForm = z.infer<ReturnType<typeof createProfileSchema>>;
type PreferencesForm = z.infer<typeof preferencesSchema>;

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    bio: '',
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    newsletter: true,
    theme: 'system' as const,
    language: 'en',
            currency: 'DZD',
    timezone: 'America/New_York',
  });

  const profileSchema = createProfileSchema(t);
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileData,
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoadingData(true);
        const [profileRes, preferencesRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/preferences'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileData({
            name: profileData.name || '',
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || '',
            dateOfBirth: profileData.dateOfBirth || '',
            bio: profileData.bio || '',
          });
          resetProfile({
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            dateOfBirth: profileData.dateOfBirth || '',
            bio: profileData.bio || '',
          });
        }

        if (preferencesRes.ok) {
          const preferencesData = await preferencesRes.json();
          setPreferences({
            emailNotifications: preferencesData.emailNotifications ?? true,
            smsNotifications: preferencesData.smsNotifications ?? false,
            marketingEmails: preferencesData.marketingEmails ?? true,
            newsletter: preferencesData.newsletter ?? true,
            theme: preferencesData.theme || 'system',
            language: preferencesData.language || 'en',
            currency: preferencesData.currency || 'DZD',
            timezone: preferencesData.timezone || 'America/New_York',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error(t('settings.failedToLoadData'));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [session?.user?.id, resetProfile]);

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          firstName: data.name.split(' ')[0] || data.name,
          lastName: data.name.split(' ').slice(1).join(' ') || '',
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          bio: data.bio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      
      // Update the session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: updatedProfile.name,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
        },
      });
      
      toast.success(t('settings.profileUpdatedSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : t('settings.failedToUpdateProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      toast.success(t('settings.preferencesSavedSuccess'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : t('settings.failedToSavePreferences'));
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof typeof preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.description')}
          </p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.profileInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={session?.user?.image || ''}
                    alt={session?.user?.name || 'User'}
                  />
                  <AvatarFallback className="text-lg">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold mb-2">{t('settings.profilePhoto')}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('settings.uploadNewPhoto')}
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      {t('settings.remove')}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('settings.photoRequirements')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">{t('settings.fullName')} *</Label>
                  <Input
                    id="name"
                    {...registerProfile('name')}
                    className={profileErrors.name ? 'border-destructive' : ''}
                  />
                  {profileErrors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">{t('settings.emailAddress')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    className={profileErrors.email ? 'border-destructive' : ''}
                  />
                  {profileErrors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
                  <Input id="phone" {...registerProfile('phone')} />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">{t('settings.dateOfBirth')}</Label>
                  <Input id="dateOfBirth" type="date" {...registerProfile('dateOfBirth')} />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">{t('settings.bio')}</Label>
                <Textarea
                  id="bio"
                  {...registerProfile('bio')}
                  placeholder={t('settings.bioPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t('settings.saving') : t('settings.saveProfile')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notificationPreferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('settings.emailNotifications')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.emailNotificationsDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('settings.smsNotifications')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.smsNotificationsDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('settings.marketingEmails')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.marketingEmailsDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('settings.newsletter')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.newsletterDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.newsletter}
                  onCheckedChange={(checked) => updatePreference('newsletter', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.displayLanguage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="theme">{t('settings.theme')}</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => updatePreference('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('settings.light')}</SelectItem>
                    <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                    <SelectItem value="system">{t('settings.system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">{t('settings.language')}</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => updatePreference('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('languages.english')}</SelectItem>
                    <SelectItem value="es">{t('languages.spanish')}</SelectItem>
                    <SelectItem value="fr">{t('languages.french')}</SelectItem>
                    <SelectItem value="de">{t('languages.german')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">{t('settings.currency')}</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) => updatePreference('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DZD">DZD (د.ج)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => updatePreference('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">{t('timezones.eastern')}</SelectItem>
                    <SelectItem value="America/Chicago">{t('timezones.central')}</SelectItem>
                    <SelectItem value="America/Denver">{t('timezones.mountain')}</SelectItem>
                    <SelectItem value="America/Los_Angeles">{t('timezones.pacific')}</SelectItem>
                    <SelectItem value="Europe/London">{t('timezones.london')}</SelectItem>
                    <SelectItem value="Europe/Paris">{t('timezones.paris')}</SelectItem>
                    <SelectItem value="Asia/Tokyo">{t('timezones.tokyo')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Preferences */}
        <div className="flex justify-end">
          <Button onClick={onSubmitPreferences} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('settings.saving') : t('settings.savePreferences')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}



