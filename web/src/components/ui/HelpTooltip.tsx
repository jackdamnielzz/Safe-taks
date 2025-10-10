"use client";

import React, { useState, useRef, useEffect } from "react";

interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  size?: "sm" | "md";
}

/**
 * HelpTooltip - Contextual help system component
 * Displays a ? icon that shows helpful information on hover/click
 */
export function HelpTooltip({
  content,
  title,
  position = "top",
  className = "",
  size = "sm",
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-5 h-5 text-sm",
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800",
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${sizeClasses[size]}`}
        aria-label="Help"
        aria-describedby={isVisible ? "help-tooltip" : undefined}
      >
        <svg className="w-full h-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="help-tooltip"
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in-0 zoom-in-95 duration-200`}
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs">
            {title && <div className="font-semibold mb-1">{title}</div>}
            <div className="text-gray-200">{content}</div>
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * HelpModal - For more detailed help content
 */
export function HelpModal({ isOpen, onClose, title, children }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HelpSection - Displays a help link that opens a modal
 */
interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  linkText?: string;
}

export function HelpSection({ title, children, linkText = "Meer informatie" }: HelpSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-blue-600 hover:text-blue-800 underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        {linkText}
      </button>

      <HelpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
        {children}
      </HelpModal>
    </>
  );
}
