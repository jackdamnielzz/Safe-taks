"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const router = useRouter();
  const { userProfile, signOutUser } = useAuth();
  const pathname = usePathname();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Calculate dropdown position
  useEffect(() => {
    if (accountDropdownOpen && accountDropdownRef.current) {
      const button = accountDropdownRef.current.querySelector("button");
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // 8px below button
          right: window.innerWidth - rect.right, // Distance from right edge of screen
        });
      }
    }
  }, [accountDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process...");
      setAccountDropdownOpen(false);
      
      // Sign out from Firebase and clear all persistence
      await signOutUser();
      console.log("Sign out successful - all auth data cleared");
      
      // Small delay to ensure all async cleanup operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a hard redirect to login page to clear all state and bypass client-side routing
      // Using window.location.href ensures a full page reload, clearing all React state
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out failed:", error);
      alert("Uitloggen mislukt. Probeer het opnieuw.");
      setAccountDropdownOpen(false);
    }
  };

  const dropdownItems: DropdownItem[] = [
    {
      id: "account",
      label: t("header.myAccount"),
      href: "/account",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: t("header.settings"),
      href: "/settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "admin",
      label: t("header.adminHub"),
      href: "/admin/hub",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      roles: ["admin", "safety_manager"],
    },
    {
      id: "signout",
      label: t("header.signOut"),
      onClick: handleSignOut,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      variant: "danger",
    },
  ];

  const visibleItems = dropdownItems.filter(
    (item) => !item.roles || (userProfile?.role && item.roles.includes(userProfile.role))
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-700 transition-colors">
                SW
              </div>
              <span className="font-bold text-lg text-slate-900">
                SafeWork Pro
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1" data-tour="navigation">
            <NavLink href="/tras" isActive={pathname === "/tras"} data-tour="create-tra">
              {t("nav.tras")}
            </NavLink>
            <NavLink href="/reports" isActive={pathname === "/reports"} data-tour="view-reports">
              {t("nav.reports")}
            </NavLink>
            <NavLink href="/team" isActive={pathname === "/team"}>
              {t("nav.team")}
            </NavLink>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-2 relative">
            <NotificationHeader />

            {userProfile ? (
              <div className="hidden sm:block relative" ref={accountDropdownRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="inline-flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                  aria-label={t("nav.accountMenu")}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200">
                    {userProfile.firstName?.[0] || "U"}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {userProfile.firstName}
                  </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${accountDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Account Dropdown */}
              {accountDropdownOpen && (
                <div
                  className="fixed w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    left: "auto",
                  }}
                >
                  <div className="p-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold border border-slate-200">
                        {userProfile.firstName?.[0] || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {userProfile.firstName} {userProfile.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {visibleItems.map((item) => (
                      <div key={item.id}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            <span
                              className={`text-slate-400 ${item.variant === "danger" ? "text-red-400" : ""}`}
                            >
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
                            className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left hover:bg-slate-50 transition-colors ${
                              item.variant === "danger"
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-slate-700 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`text-slate-400 ${item.variant === "danger" ? "text-red-400" : ""}`}
                            >
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
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {t("auth.signIn")}
              </Link>
            )}

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
  isActive,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  [key: string]: any;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "text-blue-600 bg-blue-50"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }`}
      {...props}
    >
      {children}
    </Link>
  );
}
