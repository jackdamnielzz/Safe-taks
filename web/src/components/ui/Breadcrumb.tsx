"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: "chevron" | "slash" | "dash";
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = "chevron",
  className = "",
}) => {
  const renderSeparator = () => {
    switch (separator) {
      case "chevron":
        return (
          <svg
            className="w-4 h-4 text-gray-400 mx-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "slash":
        return <span className="text-gray-400 mx-2">/</span>;
      case "dash":
        return <span className="text-gray-400 mx-2">-</span>;
      default:
        return null;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-0 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && renderSeparator()}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast ? "text-gray-900 font-medium" : "text-gray-600"
                  }`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

interface BreadcrumbSkeletonProps {
  items?: number;
  className?: string;
}

export const BreadcrumbSkeleton: React.FC<BreadcrumbSkeletonProps> = ({
  items = 3,
  className = "",
}) => {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb loading">
      <ol className="flex items-center space-x-2 text-sm">
        {Array.from({ length: items }).map((_, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <div className="w-4 h-4 mx-2 bg-gray-200 rounded animate-pulse" />}
            <div
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: `${60 + Math.random() * 40}px` }}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
};

interface CollapsibleBreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  separator?: "chevron" | "slash" | "dash";
  className?: string;
}

export const CollapsibleBreadcrumb: React.FC<CollapsibleBreadcrumbProps> = ({
  items,
  maxItems = 3,
  separator = "chevron",
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (items.length === 0) {
    return null;
  }

  // If items fit within max, show all
  if (items.length <= maxItems) {
    return <Breadcrumb items={items} separator={separator} className={className} />;
  }

  // Show collapsed version
  const visibleItems = isExpanded ? items : [items[0], ...items.slice(-(maxItems - 1))];

  const hiddenCount = items.length - maxItems;

  const renderSeparator = () => {
    switch (separator) {
      case "chevron":
        return (
          <svg
            className="w-4 h-4 text-gray-400 mx-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "slash":
        return <span className="text-gray-400 mx-2">/</span>;
      case "dash":
        return <span className="text-gray-400 mx-2">-</span>;
      default:
        return null;
    }
  };

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-0 text-sm">
        {!isExpanded && hiddenCount > 0 && (
          <>
            {/* First item */}
            <li className="flex items-center">
              {items[0].href ? (
                <Link
                  href={items[0].href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {items[0].icon && <span className="w-4 h-4">{items[0].icon}</span>}
                  {items[0].label}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-600">
                  {items[0].icon && <span className="w-4 h-4">{items[0].icon}</span>}
                  {items[0].label}
                </span>
              )}
            </li>

            {renderSeparator()}

            {/* Ellipsis button */}
            <li>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                aria-label={`Show ${hiddenCount} hidden items`}
              >
                ...
              </button>
            </li>

            {renderSeparator()}

            {/* Last items */}
            {items.slice(-(maxItems - 1)).map((item, index) => {
              const isLast = index === maxItems - 2;
              return (
                <li key={`visible-${index}`} className="flex items-center">
                  {index > 0 && renderSeparator()}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={`flex items-center gap-1.5 ${
                        isLast ? "text-gray-900 font-medium" : "text-gray-600"
                      }`}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </>
        )}

        {isExpanded &&
          items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center">
                {index > 0 && renderSeparator()}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 ${
                      isLast ? "text-gray-900 font-medium" : "text-gray-600"
                    }`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
};
