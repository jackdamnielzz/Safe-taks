"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  backLink,
  className = "",
}) => {
  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 text-gray-400 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Back Link */}
        {backLink && (
          <div className="mb-3">
            <Link
              href={backLink.href}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7"></path>
              </svg>
              {backLink.label}
            </Link>
          </div>
        )}

        {/* Header Content */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-3 ml-4">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

interface PageHeaderSkeletonProps {
  showBreadcrumbs?: boolean;
  showActions?: boolean;
}

export const PageHeaderSkeleton: React.FC<PageHeaderSkeletonProps> = ({
  showBreadcrumbs = false,
  showActions = false,
}) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        {showBreadcrumbs && (
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>

          {showActions && (
            <div className="flex items-center gap-3 ml-4">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

interface PageHeaderWithTabsProps extends PageHeaderProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const PageHeaderWithTabs: React.FC<PageHeaderWithTabsProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  backLink,
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 text-gray-400 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Back Link */}
        {backLink && (
          <div className="mb-3">
            <Link
              href={backLink.href}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7"></path>
              </svg>
              {backLink.label}
            </Link>
          </div>
        )}

        {/* Header Content */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-3 ml-4">{actions}</div>}
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
