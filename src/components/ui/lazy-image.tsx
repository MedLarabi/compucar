"use client";

import { useState, useRef, useEffect } from "react";
import { OptimizedImage } from "./optimized-image";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  threshold?: number;
  rootMargin?: string;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality = 85,
  threshold = 0.1,
  rootMargin = "50px",
  placeholder = "blur",
  blurDataURL,
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer if priority is true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, threshold, rootMargin]);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          sizes={sizes}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className="w-full h-full"
        />
      ) : (
        <div
          className={cn(
            "animate-pulse bg-muted rounded-md",
            fill ? "absolute inset-0" : ""
          )}
          style={width && height ? { width, height } : {}}
        />
      )}
    </div>
  );
}
