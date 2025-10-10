"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  const spinner = (
    <div
      className={`inline-block ${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90">
        {spinner}
        {text && <p className="mt-4 text-gray-700 font-medium">{text}</p>}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center gap-3">
        {spinner}
        <p className="text-gray-700">{text}</p>
      </div>
    );
  }

  return spinner;
};

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: "text" | "rectangular" | "circular";
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  variant = "text",
  animation = "pulse",
}) => {
  const variantClasses = {
    text: "rounded h-4",
    rectangular: "rounded-md",
    circular: "rounded-full",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-wave",
    none: "",
  };

  const styles = {
    width: width || (variant === "circular" ? "40px" : "100%"),
    height: height || (variant === "text" ? "1rem" : variant === "circular" ? "40px" : "80px"),
  };

  return (
    <div
      className={`bg-gray-200 ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={styles}
      aria-hidden="true"
    />
  );
};

interface CardSkeletonProps {
  rows?: number;
  includeImage?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  rows = 3,
  includeImage = false,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {includeImage && <Skeleton variant="rectangular" height="200px" className="mb-4" />}
      <Skeleton width="70%" height="24px" className="mb-3" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="mb-2" />
      ))}
    </div>
  );
};

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-lg text-gray-700">{text}</p>
      </div>
    </div>
  );
};
