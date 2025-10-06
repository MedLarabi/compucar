"use client";

import { useState } from "react";
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

const reviewSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rating: z.number().min(1, "Please select a rating").max(5, "Rating cannot exceed 5 stars"),
  content: z.string().min(10, "Review must be at least 10 characters long"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

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
      rating: 0
    }
  });

  const currentRating = watch("rating");

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
        toast.success("Review submitted successfully!", {
          description: "Your review will be published after admin approval."
        });
        setIsSubmitted(true);
        reset();
        setRating(0);
        onReviewSubmitted?.();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review. Please try again.");
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
              <h3 className="text-xl font-semibold text-green-700">Review Submitted!</h3>
              <p className="text-muted-foreground mt-2">
                Thank you for your review. It will be published after admin approval.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
            >
              Write Another Review
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
          <Label className="text-base font-medium">Rating *</Label>
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
                {currentRating} star{currentRating !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-sm text-red-500">{errors.rating.message}</p>
          )}
        </div>

        {/* Name Field - Second */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium">Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Your name"
            className={cn(
              "h-11",
              errors.name ? "border-red-500" : ""
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field - Third */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="your.email@example.com"
            className={cn(
              "h-11",
              errors.email ? "border-red-500" : ""
            )}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Review Content - Fourth */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-base font-medium">Your Review *</Label>
          <Textarea
            id="content"
            {...register("content")}
            placeholder="Tell others about your experience with this product..."
            rows={5}
            className={cn(
              "resize-none",
              errors.content ? "border-red-500" : ""
            )}
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
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
              Submitting Review...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
