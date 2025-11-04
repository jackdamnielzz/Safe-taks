/**
 * Notification Service
 * Handles push notifications and email notifications for stop-work alerts
 * W1.6: Supervisor Notifications Implementation
 */

import { StopWorkAlert } from './types/lmra';
import type { ApprovalRequest } from '@/types/approval';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface EmailNotificationPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

export class NotificationService {
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[Notifications] Service Worker not supported');
      return;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      console.log('[Notifications] Service Worker ready');

      // Get VAPID public key from environment
      this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
      
      if (!this.vapidPublicKey) {
        console.warn('[Notifications] VAPID public key not configured');
      }
    } catch (error) {
      console.error('[Notifications] Failed to initialize:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[Notifications] Permission:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.vapidPublicKey) {
      console.warn('[Notifications] Cannot subscribe: missing registration or VAPID key');
      return null;
    }

    try {
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      console.log('[Notifications] Push subscription created');
      
      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[Notifications] Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Send push subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend');
      }

      console.log('[Notifications] Subscription sent to backend');
    } catch (error) {
      console.error('[Notifications] Failed to send subscription:', error);
    }
  }

  /**
   * Show local notification (fallback when push not available)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Notifications not supported');
      return;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    try {
      if (this.registration) {
        // Use service worker notification
        const options: any = {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/icon-72x72.png',
          data: payload.data,
          vibrate: [200, 100, 200],
          tag: payload.data?.alertId || 'notification',
          requireInteraction: true,
        };
        
        // Add actions if supported (not in all browsers)
        if (payload.actions) {
          options.actions = payload.actions;
        }
        
        await this.registration.showNotification(payload.title, options);
      } else {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          data: payload.data,
        });
      }

      console.log('[Notifications] Local notification shown');
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error);
    }
  }

  /**
   * Send stop-work alert notification to supervisors
   */
  async sendStopWorkAlert(alert: StopWorkAlert, supervisorIds: string[]): Promise<void> {
    try {
      // Format notification payload
      const payload: NotificationPayload = {
        title: '🛑 STOP WERK ALERT',
        body: `Ernst: ${this.getSeverityLabel(alert.severity)} | ${alert.reason}`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          type: 'stop-work-alert',
          alertId: alert.id,
          lmraId: alert.lmraId,
          severity: alert.severity,
          url: `/stop-work/${alert.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'Bekijk details',
          },
          {
            action: 'acknowledge',
            title: 'Bevestig ontvangst',
          },
        ],
      };

      // Send push notification via backend
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: supervisorIds,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      console.log('[Notifications] Stop-work alert sent to supervisors');

      // Also send email notification
      await this.sendStopWorkEmail(alert, supervisorIds);
    } catch (error) {
      console.error('[Notifications] Failed to send stop-work alert:', error);
      
      // Fallback: show local notification
      await this.showLocalNotification({
        title: '🛑 STOP WERK ALERT',
        body: `Ernst: ${this.getSeverityLabel(alert.severity)} | ${alert.reason}`,
        data: {
          type: 'stop-work-alert',
          alertId: alert.id,
        },
      });
    }
  }

  /**
   * Send stop-work alert email
   */
  private async sendStopWorkEmail(alert: StopWorkAlert, supervisorIds: string[]): Promise<void> {
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'stop-work-alert',
          alert,
          recipientIds: supervisorIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      console.log('[Notifications] Stop-work email sent');
    } catch (error) {
      console.error('[Notifications] Failed to send email:', error);
    }
  }

  /**
   * Get severity label in Dutch
   */
  private getSeverityLabel(severity: 'moderate' | 'high' | 'critical'): string {
    switch (severity) {
      case 'moderate':
        return 'Matig';
      case 'high':
        return 'Hoog';
      case 'critical':
        return 'Kritiek';
      default:
        return 'Onbekend';
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[Notifications] Unsubscribed from push');
      }
    } catch (error) {
      console.error('[Notifications] Failed to unsubscribe:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Send approval request notification
   */
  async sendApprovalRequest(approval: ApprovalRequest, approverIds: string[]): Promise<void> {
    try {
      const currentStep = approval.steps.find((s) => s.step === approval.currentStep);
      if (!currentStep) return;

      const payload: NotificationPayload = {
        title: '📋 Nieuw Goedkeuringsverzoek',
        body: `TRA goedkeuring vereist: ${currentStep.name}`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          type: 'approval-request',
          approvalId: approval.id,
          traId: approval.traId,
          step: approval.currentStep,
          url: `/approvals/${approval.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'Bekijk details',
          },
        ],
      };

      // Send push notification via backend
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: approverIds,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      console.log('[Notifications] Approval request sent to approvers');

      // Also send email notification
      await this.sendApprovalEmail(approval, approverIds, 'request');
    } catch (error) {
      console.error('[Notifications] Failed to send approval request:', error);

      // Fallback: show local notification
      await this.showLocalNotification({
        title: '📋 Nieuw Goedkeuringsverzoek',
        body: 'Een TRA vereist uw goedkeuring',
        data: {
          type: 'approval-request',
          approvalId: approval.id,
        },
      });
    }
  }

  /**
   * Send approval decision notification (approved/rejected)
   */
  async sendApprovalDecision(
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
    recipientIds: string[]
  ): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: decision === 'approved' ? '✅ TRA Goedgekeurd' : '❌ TRA Afgewezen',
        body:
          decision === 'approved'
            ? 'Uw TRA is goedgekeurd en kan worden uitgevoerd'
            : 'Uw TRA is afgewezen en vereist herziening',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          type: 'approval-decision',
          approvalId: approval.id,
          traId: approval.traId,
          decision,
          url: `/tras/${approval.traId}`,
        },
        actions: [
          {
            action: 'view',
            title: 'Bekijk TRA',
          },
        ],
      };

      // Send push notification via backend
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: recipientIds,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      console.log('[Notifications] Approval decision sent');

      // Also send email notification
      await this.sendApprovalEmail(approval, recipientIds, decision);
    } catch (error) {
      console.error('[Notifications] Failed to send approval decision:', error);

      // Fallback: show local notification
      await this.showLocalNotification({
        title: decision === 'approved' ? '✅ TRA Goedgekeurd' : '❌ TRA Afgewezen',
        body:
          decision === 'approved'
            ? 'Uw TRA is goedgekeurd'
            : 'Uw TRA is afgewezen',
        data: {
          type: 'approval-decision',
          approvalId: approval.id,
        },
      });
    }
  }

  /**
   * Send approval email notification
   */
  private async sendApprovalEmail(
    approval: ApprovalRequest,
    recipientIds: string[],
    type: 'request' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: `approval-${type}`,
          approval,
          recipientIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      console.log('[Notifications] Approval email sent');
    } catch (error) {
      console.error('[Notifications] Failed to send approval email:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let notificationServiceInstance: NotificationService | null = null;

/**
 * Get singleton notification service instance
 */
export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
    notificationServiceInstance.initialize();
  }
  return notificationServiceInstance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Request notification permission and subscribe to push
 */
export async function setupNotifications(): Promise<boolean> {
  const service = getNotificationService();
  
  if (!service.isSupported()) {
    console.warn('[Notifications] Not supported on this device');
    return false;
  }

  const permission = await service.requestPermission();
  if (permission !== 'granted') {
    console.warn('[Notifications] Permission denied');
    return false;
  }

  const subscription = await service.subscribeToPush();
  return subscription !== null;
}

/**
 * Show a test notification
 */
export async function showTestNotification(): Promise<void> {
  const service = getNotificationService();
  
  await service.showLocalNotification({
    title: 'Test Notificatie',
    body: 'Dit is een test notificatie van SafeWork Pro',
    icon: '/icon-192x192.png',
  });
}
