'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample notifications data (same as in NotificationHeader)
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nieuwe veiligheidsinspectie vereist',
        message: 'Er staat een periodieke veiligheidsinspectie gepland voor project "Kantoor Renovat"',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        actionUrl: '/projects/1'
      },
      {
        id: '2',
        title: 'TRA goedgekeurd',
        message: 'De Taak Risico Analyse voor "Dakwerken Project" is goedgekeurd door de veiligheidscoördinator',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        actionUrl: '/tras/2'
      },
      {
        id: '3',
        title: 'Veiligheidsmelding ontvangen',
        message: 'Er is een nieuwe veiligheidsmelding ontvangen van veldwerker Jan Smit',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        read: true,
        actionUrl: '/safety-reports/3'
      },
      {
        id: '4',
        title: 'Certificaat verloopt binnenkort',
        message: 'Het VCA-certificaat van Pieter Jansen verloopt over 14 dagen',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        actionUrl: '/certificates/4'
      },
      {
        id: '5',
        title: 'Nieuwe veiligheidsrichtlijn',
        message: 'Er is een nieuwe veiligheidsrichtlijn gepubliceerd: "Werken op hoogte - Update 2024"',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
        actionUrl: '/guidelines/5'
      }
    ];

    setNotifications(sampleNotifications);
    setLoading(false);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Zojuist';
    if (diffInMinutes < 60) return `${diffInMinutes} minuten geleden`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} uur geleden`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dagen geleden`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Meldingen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meldingen</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} ongelezen melding${unreadCount !== 1 ? 'en' : ''}` : 'Alle meldingen gelezen'}
                </p>
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="flex space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    Alles als gelezen markeren
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Alles wissen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Geen meldingen</h3>
            <p className="mt-1 text-sm text-gray-500">Je hebt momenteel geen meldingen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 p-4 rounded-r-lg shadow-sm ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getNotificationIcon(notification.type)}</span>
                      <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nieuw
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {notification.actionUrl && (
                      <button
                        onClick={() => notification.actionUrl && (window.location.href = notification.actionUrl)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Bekijk details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Markeren als gelezen"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Verwijderen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}