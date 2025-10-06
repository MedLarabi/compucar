"use client";

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface EnhancedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  webpSrc?: string;
  avifSrc?: string;
}

export function EnhancedImage({
  src,
  fallbackSrc,
  webpSrc,
  avifSrc,
  alt,
  ...props
}: EnhancedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageFormat, setImageFormat] = useState<'avif' | 'webp' | 'original'>('original');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check browser support for modern image formats
    const checkFormatSupport = async () => {
      // Check AVIF support
      if (avifSrc && supportsFormat('avif')) {
        setImageFormat('avif');
        setImageSrc(avifSrc);
        return;
      }
      
      // Check WebP support
      if (webpSrc && supportsFormat('webp')) {
        setImageFormat('webp');
        setImageSrc(webpSrc);
        return;
      }
      
      // Use original format
      setImageFormat('original');
      setImageSrc(src);
    };

    checkFormatSupport();
  }, [src, webpSrc, avifSrc]);

  const supportsFormat = (format: 'webp' | 'avif'): boolean => {
    // Create a canvas element to test format support
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const dataURL = canvas.toDataURL(`image/${format}`);
      return dataURL.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  };

  const handleError = () => {
    setHasError(true);
    
    // Try fallback formats in order
    if (imageFormat === 'avif' && webpSrc) {
      setImageFormat('webp');
      setImageSrc(webpSrc);
      return;
    }
    
    if ((imageFormat === 'avif' || imageFormat === 'webp') && src !== imageSrc) {
      setImageFormat('original');
      setImageSrc(src);
      return;
    }
    
    // If all else fails, use fallback source
    if (fallbackSrc && src !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Jo9libO5O2UYcBAwP8SplYgp25r7OqnDJ7zVlOd6syzAAAWQLvhOmJ1LqKyFo0+vX3qJWkQrzAKvUTcjLEQgWVOoR9gGgjAkL8K1qyGGdQdKXVpDwE7YruT9hbEz8f8TcjnHs1T2KeJhjYJMGp3gYsYAYKmL9EbBFGe0lBr2ZvA8G6SeLlRAOgBwWONzjJPg2V6QLhYnY3mDCjqhggBHZRbA="
      priority={props.priority}
    />
  );
}

// Hook for checking image format support
export const useImageFormatSupport = () => {
  const [supports, setSupports] = useState<{
    webp: boolean;
    avif: boolean;
  }>({ webp: false, avif: false });

  useEffect(() => {
    const checkSupport = () => {
      const webpSupport = supportsImageFormat('webp');
      const avifSupport = supportsImageFormat('avif');
      
      setSupports({
        webp: webpSupport,
        avif: avifSupport,
      });
    };

    checkSupport();
  }, []);

  return supports;
};

const supportsImageFormat = (format: 'webp' | 'avif'): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const dataURL = canvas.toDataURL(`image/${format}`);
    return dataURL.indexOf(`data:image/${format}`) === 0;
  } catch {
    return false;
  }
};
