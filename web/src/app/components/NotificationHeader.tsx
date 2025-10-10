"use client";

import React, { useState, useEffect, useRef } from "react";

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

export function NotificationHeader() {
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

  // Debug function to test notification functionality
  const testNotificationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("🔔 Notification button clicked!", {
      event: e.type,
      target: e.target,
      currentState: { notificationsOpen, notifications: notifications.length }
    });
    setNotificationsOpen(!notificationsOpen);
  };

  // Debug: Test if component is properly loaded
  useEffect(() => {
    console.log("🔧 NotificationHeader loaded with notification system", {
      notificationsCount: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    });
  }, []);

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

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={testNotificationClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group -mr-6 md:mr-0"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 text-gray-600 group-hover:text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-3 right-5 md:top-1 md:right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
                onClick={() => {
                  setNotificationsOpen(false);
                  window.location.href = "/notifications";
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
              >
                Alle meldingen bekijken →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}