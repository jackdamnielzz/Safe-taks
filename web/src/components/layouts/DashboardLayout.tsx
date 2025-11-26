"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

// Notification types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Stop Work Alert",
      message: "Jan de Vries heeft een stop work beslissing genomen voor LMRA sessie #1234",
      type: "error",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      actionUrl: "/lmra/sessions/1234",
    },
    {
      id: "2",
      title: "Nieuwe TRA Goedkeuring Vereist",
      message: 'TRA "Hoogwerkzaamheden" wacht op uw goedkeuring',
      type: "warning",
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      actionUrl: "/tras/5678",
    },
    {
      id: "3",
      title: "Teamlid Toegevoegd",
      message: 'Maria Jansen is toegevoegd aan project "Bouwplaats Amsterdam"',
      type: "info",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      actionUrl: "/projects/amsterdam",
    },
  ]);
  const pathname = usePathname();

  const t = useTranslations();
  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: "📊" },
    { name: t("nav.tras"), href: "/tras", icon: "📋" },
    { name: t("nav.projects"), href: "/projects", icon: "🏗️" },
    { name: t("nav.templates"), href: "/templates", icon: "📝" },
    { name: t("nav.lmra"), href: "/lmra", icon: "📱" },
    { name: t("nav.reports"), href: "/reports", icon: "📈" },
    { name: t("nav.team"), href: "/team", icon: "👥" },
    { name: t("nav.settings"), href: "/settings", icon: "⚙️" },
  ];

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(href + "/") ?? false);

  // Notification functions
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Debug function to test notification functionality
  const testNotificationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("🔔 Notification button clicked!", {
      event: e.type,
      target: e.target,
      currentState: { notificationsOpen, notifications: notifications.length },
    });
    setNotificationsOpen(!notificationsOpen);
  };

  // Debug: Test if component is properly loaded
  useEffect(() => {
    console.log("🔧 DashboardLayout loaded with notification system", {
      notificationsCount: notifications.length,
      unreadCount: unreadCount,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-slate-200`}
        style={{ width: "260px" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              SW
            </div>
            <span className="text-lg font-bold text-slate-900">SafeWork Pro</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-lg opacity-80">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                <p className="text-xs text-slate-500 truncate">Safety Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? "ml-[260px]" : "ml-0"}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={sidebarOpen ? t("dashboard.closeSidebar") : t("dashboard.openSidebar")}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <div className="flex-1 ml-6">
            <input
              type="search"
              placeholder={t("search.placeholder")}
              className="w-full max-w-md px-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={testNotificationClick}
                className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t("dashboard.notifications")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {t("dashboard.notifications")}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          {t("dashboard.markAllAsRead")}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        {t("dashboard.noNotifications")}
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                              setNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "warning"
                                        ? "bg-orange-500"
                                        : notification.type === "success"
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                  }`}
                                ></span>
                                <h4 className="text-sm font-medium text-slate-900 truncate">{notification.title}</h4>
                                {!notification.read && (
                                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mb-1.5 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-slate-400">
                                {notification.timestamp.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                              aria-label={t("dashboard.dismissNotification")}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-800 py-1"
                      >
                        {t("dashboard.viewAllNotifications")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Help */}
            <button
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t("dashboard.help")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
};
