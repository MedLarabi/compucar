"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from "next-auth/react";

type ReviewFormData = {
  name: string;
  email: string;
  rating: number;
  content?: string; // Made optional to match Zod schema
};

interface ReviewFormProps {
  productSlug: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ productSlug, productName, onReviewSubmitted }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { t } = useLanguage();
  const { data: session } = useSession();

  // Create dynamic schema with translations - make content optional
  const reviewSchema = z.object({
    name: z.string().min(2, t('product.reviewForm.nameRequired')),
    email: z.string().email(t('product.reviewForm.emailRequired')),
    rating: z.number().min(1, t('product.reviewForm.ratingRequired')).max(5, "Rating cannot exceed 5 stars"),
    content: z.string().optional(), // Made optional
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      name: "",
      email: "",
      content: "" // Keep as empty string for form handling
    }
  });

  const currentRating = watch("rating");

  // Auto-fill user data when logged in
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) {
        setValue("name", session.user.name);
      }
      if (session.user.email) {
        setValue("email", session.user.email);
      }
    }
  }, [session, setValue]);

  const handleRatingClick = (value: number) => {
    setRating(value);
    setValue("rating", value);
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t('product.reviewForm.reviewSubmittedSuccess'), {
          description: t('product.reviewForm.reviewSubmittedPending')
        });
        setIsSubmitted(true);
        reset({
          rating: 0,
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          content: ""
        });
        setRating(0);
        onReviewSubmitted?.();
      } else {
        toast.error(result.error || t('product.reviewForm.submitReviewFailed'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('product.reviewForm.submitReviewError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-700">{t('product.reviewForm.reviewSubmitted')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('product.reviewForm.reviewSubmittedDescription')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
            >
              {t('product.reviewForm.writeAnotherReview')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-background p-6 rounded-lg border">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Rating Stars - First */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t('product.reviewForm.rating')} *</Label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    value <= (hoveredRating || currentRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-300"
                  )}
                />
              </button>
            ))}
            {currentRating > 0 && (
              <span className="ml-3 text-sm text-muted-foreground">
                {currentRating} {currentRating !== 1 ? t('product.reviewForm.stars') : t('product.reviewForm.star')}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-sm text-red-500">{errors.rating.message}</p>
          )}
        </div>

        {/* Name Field - Second */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium">{t('product.reviewForm.name')} *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t('product.reviewForm.namePlaceholder')}
            disabled={!!session?.user?.name}
            className={cn(
              "h-11",
              errors.name ? "border-red-500" : "",
              session?.user?.name ? "bg-muted cursor-not-allowed" : ""
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
          {session?.user?.name && (
            <p className="text-xs text-muted-foreground">{t('product.reviewForm.autoFilledFromAccount')}</p>
          )}
        </div>

        {/* Email Field - Third */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">{t('product.reviewForm.email')} *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder={t('product.reviewForm.emailPlaceholder')}
            disabled={!!session?.user?.email}
            className={cn(
              "h-11",
              errors.email ? "border-red-500" : "",
              session?.user?.email ? "bg-muted cursor-not-allowed" : ""
            )}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          {session?.user?.email && (
            <p className="text-xs text-muted-foreground">{t('product.reviewForm.autoFilledFromAccount')}</p>
          )}
        </div>

        {/* Review Content - Fourth */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-base font-medium">{t('product.reviewForm.yourReview')}</Label>
          <Textarea
            id="content"
            {...register("content")}
            placeholder={t('product.reviewForm.reviewPlaceholder')}
            rows={5}
            className={cn(
              "resize-none",
              errors.content ? "border-red-500" : ""
            )}
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
          <p className="text-xs text-muted-foreground">{t('product.reviewForm.reviewOptional')}</p>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-11"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t('product.reviewForm.submittingReview')}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t('product.reviewForm.submitReview')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
