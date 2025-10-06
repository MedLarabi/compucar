"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">{t('errors.accessDenied')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('errors.noPermissions')}
          </p>
          <div className="space-y-2">
            <Button 
              variant="default" 
              onClick={() => router.push("/")}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {t('errors.backToHome')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('errors.goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
