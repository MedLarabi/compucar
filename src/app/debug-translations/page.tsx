'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function DebugTranslationsPage() {
  const { t, language, setLanguage } = useLanguage();

  const testKeys = [
    'filters.sortBy',
    'filters.newest',
    'filters.oldest',
    'filters.priceLowHigh',
    'filters.priceHighLow',
    'filters.nameAZ',
    'filters.nameZA',
    'filters.highestRated',
    'filters.priceRange',
    'filters.apply',
    'filters.clearAll',
    'filters.active',
    'messages.showingResults',
    'messages.noProductsFound',
    'messages.tryAdjusting',
    'common.filter',
    'common.next',
    'common.previous'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Translation Debug</h1>
          <LanguageSwitcher />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Language: {language}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testKeys.map((key) => (
                <div key={key} className="border rounded p-3">
                  <div className="text-sm text-muted-foreground mb-1">{key}</div>
                  <div className="font-mono text-sm">{t(key)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Showing Results:</strong> {t('messages.showingResults', { start: 1, end: 10, total: 50 })}
              </div>
              <div>
                <strong>Filter Title:</strong> {t('filters.sortBy')} & {t('common.filter')}
              </div>
              <div>
                <strong>Sort Options:</strong>
                <ul className="list-disc list-inside mt-2">
                  <li>{t('filters.newest')}</li>
                  <li>{t('filters.oldest')}</li>
                  <li>{t('filters.priceLowHigh')}</li>
                  <li>{t('filters.priceHighLow')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Switching Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => setLanguage('en')}>English</Button>
              <Button onClick={() => setLanguage('fr')}>Français</Button>
              <Button onClick={() => setLanguage('ar')}>العربية</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
