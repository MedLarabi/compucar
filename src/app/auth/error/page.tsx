"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Home, LogIn } from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { useLanguage } from '@/contexts/LanguageContext';

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  CredentialsSignin: "The credentials you provided are incorrect.",
  SessionRequired: "You must be signed in to access this page.",
  Callback: "An error occurred in the authentication callback.",
  OAuthSignin: "An error occurred during OAuth sign in.",
  OAuthCallback: "An error occurred during OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth account.",
  EmailCreateAccount: "Could not create email account.",
  OAuthAccountNotLinked: "This account is not linked to your profile.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const { t } = useLanguage();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const getErrorMessage = (errorCode: string) => {
    return errorMessages[errorCode as keyof typeof errorMessages] || errorMessages.Default;
  };

  const getErrorSolution = (errorCode: string) => {
    switch (errorCode) {
      case "Configuration":
        return [
          "The authentication service is temporarily unavailable.",
          "Please contact the administrator if this problem persists.",
          "Check that all environment variables are properly configured."
        ];
      case "AccessDenied":
        return [
          "Your account may not have the required permissions.",
          "Contact an administrator for access.",
        ];
      case "Verification":
        return [
          "The verification link has expired.",
          "Please request a new verification email.",
        ];
      case "CredentialsSignin":
        return [
          "Please check your email and password.",
          "Make sure your account exists and is active.",
        ];
      case "OAuthAccountNotLinked":
        return [
          "This social account is not linked to any existing account.",
          "Try signing in with your email and password first.",
        ];
      default:
        return [
          "Please try again in a few moments.",
          "If the problem persists, contact support.",
        ];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <AuthHeader />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              {t('auth.authenticationError')}
            </CardTitle>
            <CardDescription>
              {t('auth.errorOccurredDuringAuth')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {error}
                  <br />
                  <span className="text-sm mt-2 block">
                    {getErrorMessage(error)}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Possible solutions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getErrorSolution(error).map((solution, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col space-y-2 pt-4">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('auth.tryAgain')}
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('common.goHome')}
                </Link>
              </Button>
            </div>

            {error === "Configuration" && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>For developers:</strong> Check your environment variables, 
                  especially NEXTAUTH_URL and NEXTAUTH_SECRET. Make sure your 
                  database is accessible and OAuth providers are properly configured.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

