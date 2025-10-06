'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Package, ShoppingCart, Heart, User, Globe } from 'lucide-react';

export default function ArabicTestPage() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">CompuCar</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Language Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('language')}
              </CardTitle>
              <CardDescription>
                Current language: {language} - {t('language')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This page demonstrates Arabic language support with consistent left-to-right layout. Only the text content changes to Arabic, while the layout remains the same.
              </p>
            </CardContent>
          </Card>

          {/* Navigation Demo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('navigation.menu')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span className="text-sm">{t('navigation.products')}</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm">{t('navigation.cart')}</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Heart className="h-6 w-6" />
                  <span className="text-sm">{t('navigation.wishlist')}</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <User className="h-6 w-6" />
                  <span className="text-sm">{t('navigation.account')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hero Section Demo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('hero.title')}</CardTitle>
              <CardDescription>{t('hero.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('hero.description')}
              </p>
              <div className="flex gap-4">
                <Button>{t('hero.shopNow')}</Button>
                <Button variant="outline">{t('hero.browseCategories')}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Demo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('product.featuredProducts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">{t('product.name')} {i}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('product.description')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">1500 DA</span>
                      <Button size="sm">{t('product.addToCart')}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Demo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('contact.name')}</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    placeholder={t('contact.name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('contact.email')}</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded-md"
                    placeholder={t('contact.email')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">{t('contact.message')}</label>
                  <textarea 
                    rows={4}
                    className="w-full p-2 border rounded-md"
                    placeholder={t('contact.message')}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full">{t('contact.send')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Info */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Information</CardTitle>
              <CardDescription>
                This section shows that the layout remains left-to-right for all languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span className="text-left">Left aligned text</span>
                  <span className="text-right">Right aligned text</span>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline">Button 1</Button>
                  <Button variant="outline">Button 2</Button>
                  <Button variant="outline">Button 3</Button>
                </div>
                
                <div className="text-center">
                  <p>Layout stays consistent across all languages</p>
                  <p className="text-muted-foreground">Only the text content changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
