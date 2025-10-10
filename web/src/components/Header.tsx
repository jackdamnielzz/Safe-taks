'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MobileMenu } from "@/components/MobileMenu";
import { NotificationHeader } from "@/app/components/NotificationHeader";
import { useAuth } from "@/components/AuthProvider";

interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: "admin" | "safety_manager" | "supervisor" | "field_worker";
  profileComplete?: boolean;
}

interface DropdownItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  roles?: string[]; // Only show for these roles
}

export function Header() {
  const { userProfile } = useAuth();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Calculate dropdown position
  useEffect(() => {
    if (accountDropdownOpen && accountDropdownRef.current) {
      const button = accountDropdownRef.current.querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // 8px below button
          right: window.innerWidth - rect.right // Distance from right edge of screen
        });
      }
    }
  }, [accountDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    if (accountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountDropdownOpen]);

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log("Signing out...");
    setAccountDropdownOpen(false);
  };

  const dropdownItems: DropdownItem[] = [
    {
      id: "account",
      label: "Mijn Account",
      href: "/account",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Instellingen",
      href: "/settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "admin",
      label: "Beheer Hub",
      href: "/admin/hub",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      roles: ["admin", "safety_manager"],
    },
    {
      id: "signout",
      label: "Uitloggen",
      onClick: handleSignOut,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      variant: "danger",
    },
  ];

  const visibleItems = dropdownItems.filter(item =>
    !item.roles || (userProfile?.role && item.roles.includes(userProfile.role))
  );

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg group-hover:shadow-indigo-500/50 transition-all">
                SW
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SafeWork Pro
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2" data-tour="navigation">
            <NavLink href="/tras" data-tour="create-tra">
              TRAs
            </NavLink>
            <NavLink href="/mobile" data-tour="execute-lmra">
              Mobile
            </NavLink>
            <NavLink href="/reports" data-tour="view-reports">
              Reports
            </NavLink>
            <NavLink href="/team">Team</NavLink>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-2 relative">
            <NotificationHeader />

            <div className="hidden sm:block relative" ref={accountDropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all group"
                aria-label="Account menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {userProfile?.firstName?.[0] || "J"}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                  {userProfile?.firstName || "John"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Account Dropdown */}
              {accountDropdownOpen && (
                <div
                  className="fixed w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    left: 'auto'
                  }}
                >
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                        {userProfile?.firstName?.[0] || "J"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {userProfile?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    {visibleItems.map((item) => (
                      <div key={item.id}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            <span className={`text-gray-400 ${item.variant === 'danger' ? 'text-red-400' : ''}`}>
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              item.onClick?.();
                              setAccountDropdownOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left hover:bg-gray-100 transition-colors ${
                              item.variant === 'danger'
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                : 'text-gray-700 hover:text-gray-900'
                            }`}
                          >
                            <span className={`text-gray-400 ${item.variant === 'danger' ? 'text-red-400' : ''}`}>
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all group"
      {...props}
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
    </Link>
  );
}