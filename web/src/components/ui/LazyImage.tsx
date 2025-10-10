"use client";

/**
 * LazyImage Component
 *
 * Lazy-loading image component using Next.js Image with IntersectionObserver.
 * Features:
 * - Lazy loading on scroll
 * - Blur placeholder support
 * - Thumbnail support
 * - Responsive images
 * - Fallback handling
 */

import React, { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";

export interface LazyImageProps
  extends Omit<ImageProps, "src" | "onLoad" | "onError" | "placeholder"> {
  /**
   * Image source URL
   */
  src: string;

  /**
   * Thumbnail URL for low-quality placeholder
   */
  thumbnailSrc?: string;

  /**
   * Alt text for accessibility
   */
  alt: string;

  /**
   * Enable blur placeholder
   */
  blurPlaceholder?: boolean;

  /**
   * Custom placeholder component (shown before image loads)
   */
  placeholderContent?: React.ReactNode;

  /**
   * Root margin for IntersectionObserver (default: '50px')
   * Loads images 50px before they enter viewport
   */
  rootMargin?: string;

  /**
   * Threshold for IntersectionObserver (default: 0.01)
   */
  threshold?: number;

  /**
   * Callback when image enters viewport
   */
  onIntersect?: () => void;

  /**
   * Callback when image loads successfully
   */
  onLoadComplete?: () => void;

  /**
   * Callback when image fails to load
   */
  onLoadError?: (error: Error) => void;

  /**
   * Custom className for container
   */
  containerClassName?: string;
}

/**
 * LazyImage component with IntersectionObserver
 */
export function LazyImage({
  src,
  thumbnailSrc,
  alt,
  blurPlaceholder = true,
  placeholderContent,
  rootMargin = "50px",
  threshold = 0.01,
  onIntersect,
  onLoadComplete,
  onLoadError,
  containerClassName = "",
  className = "",
  ...imageProps
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Set up IntersectionObserver
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            if (onIntersect) {
              onIntersect();
            }
            // Once loaded, we can disconnect
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, isInView, onIntersect]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoadComplete) {
      onLoadComplete();
    }
  };

  const handleError = () => {
    setHasError(true);
    if (onLoadError) {
      onLoadError(new Error("Image failed to load"));
    }
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${containerClassName}`}>
      {/* Show placeholder until image is in view */}
      {!isInView && placeholderContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholderContent}
        </div>
      )}

      {/* Show thumbnail while full image loads */}
      {!isInView && !placeholderContent && thumbnailSrc && (
        <Image
          src={thumbnailSrc}
          alt={alt}
          fill
          className={`object-cover ${blurPlaceholder ? "blur-sm" : ""}`}
          {...imageProps}
        />
      )}

      {/* Load full image when in view */}
      {isInView && !hasError && (
        <Image
          src={src}
          alt={alt}
          className={`${className} ${!isLoaded ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
          onLoad={handleLoad}
          onError={handleError}
          {...imageProps}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Afbeelding niet beschikbaar</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

/**
 * LazyImageGrid - Grid container optimized for lazy-loaded images
 */
export interface LazyImageGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: number;
  className?: string;
}

export function LazyImageGrid({
  children,
  columns = 3,
  gap = 4,
  className = "",
}: LazyImageGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>{children}</div>;
}

/**
 * LazyBackgroundImage - Lazy-loaded background image
 */
export interface LazyBackgroundImageProps {
  src: string;
  thumbnailSrc?: string;
  children?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export function LazyBackgroundImage({
  src,
  thumbnailSrc,
  children,
  className = "",
  rootMargin = "50px",
  threshold = 0.01,
}: LazyBackgroundImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold, isInView]);

  useEffect(() => {
    if (!isInView) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded
          ? `url(${src})`
          : thumbnailSrc
            ? `url(${thumbnailSrc})`
            : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!isLoaded && !thumbnailSrc && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      {children}
    </div>
  );
}
