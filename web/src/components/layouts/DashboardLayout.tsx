"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "TRAs", href: "/tras", icon: "📋" },
    { name: "Projects", href: "/projects", icon: "🏗️" },
    { name: "Templates", href: "/templates", icon: "📝" },
    { name: "LMRA Sessions", href: "/lmra", icon: "📱" },
    { name: "Reports", href: "/reports", icon: "📈" },
    { name: "Team", href: "/team", icon: "👥" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
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
        } bg-white border-r border-gray-200`}
        style={{ width: "260px" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
            <span className="text-2xl">🏗️</span>
            <span className="text-xl font-bold text-gray-900">SafeWork Pro</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">Safety Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? "ml-[260px]" : "ml-0"}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              className="w-6 h-6"
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
              placeholder="Search TRAs, projects, or templates..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={testNotificationClick}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6"
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Meldingen</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Alles als gelezen markeren
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Geen meldingen</div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                              setNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "warning"
                                        ? "bg-orange-500"
                                        : notification.type === "success"
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                  }`}
                                ></span>
                                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                {!notification.read && (
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {notification.timestamp.toLocaleTimeString("nl-NL")}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              aria-label="Melding verwijderen"
                            >
                              <svg
                                className="w-4 h-4"
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
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
                      >
                        Alle meldingen bekijken →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Help */}
            <button
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Help"
            >
              <svg
                className="w-6 h-6"
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
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
