"use client";

import React, { useEffect } from "react";
import { useBottomSheet } from "@/hooks/useTouchOptimized";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
  maxHeight?: string;
  className?: string;
}

/**
 * BottomSheet - Mobile-optimized modal that slides up from bottom
 * Supports swipe-to-dismiss gesture
 * Following DESIGN_SYSTEM_ENHANCEMENTS.md Section 5.1
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  maxHeight = "90vh",
  className = "",
}: BottomSheetProps) {
  const { sheetRef, handleProps } = useBottomSheet();

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? "is-open" : ""} ${className}`}
        style={{ maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
      >
        {/* Handle for swipe gesture */}
        {showHandle && <div {...handleProps} className="bottom-sheet-handle" />}

        {/* Title */}
        {title && (
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </>
  );
}
