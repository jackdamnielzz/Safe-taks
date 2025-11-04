/**
 * Unit tests for StopWorkService
 * W1.6: Stop-Work Authority Implementation
 */

import { StopWorkService, getStopWorkService } from '../stopWorkService';
import { CreateStopWorkRequest } from '../types/lmra';

// Mock the offlineSyncManager
jest.mock('../offlineSyncManager', () => ({
  getOfflineSyncManager: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('StopWorkService', () => {
  let service: StopWorkService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    (global.fetch as jest.Mock).mockClear();
    
    // Create fresh service instance
    service = new StopWorkService();
    
    // Set online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('createStopWorkAlert', () => {
    const mockRequest: CreateStopWorkRequest = {
      lmraId: 'test-lmra-123',
      triggeredBy: 'user-123',
      triggeredByName: 'John Doe',
      reason: 'Unsafe scaffolding detected',
      severity: 'high',
      category: 'hazard',
      description: 'Scaffolding is unstable and poses immediate danger',
      photoIds: ['photo-1', 'photo-2'],
      signature: {
        signerId: 'user-123',
        signerName: 'John Doe',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
      },
    };

    it('should create stop-work alert successfully when online', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'alert-123' },
        }),
      });

      const alert = await service.createStopWorkAlert(mockRequest);

      // Verify alert structure
      expect(alert).toMatchObject({
        lmraId: mockRequest.lmraId,
        triggeredBy: mockRequest.triggeredBy,
        triggeredByName: mockRequest.triggeredByName,
        reason: mockRequest.reason,
        severity: mockRequest.severity,
        category: mockRequest.category,
        description: mockRequest.description,
        photoIds: mockRequest.photoIds,
        status: 'active',
        syncStatus: 'pending',
      });

      // Verify alert has required fields
      expect(alert.id).toMatch(/^stopwork_\d+_[a-z0-9]+$/);
      expect(alert.triggeredAt).toBeInstanceOf(Date);
      expect(alert.createdAt).toBeInstanceOf(Date);
      expect(alert.signature.signedAt).toBeInstanceOf(Date);

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/lmras/${mockRequest.lmraId}/stop-work`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should queue alert when offline', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const alert = await service.createStopWorkAlert(mockRequest);

      // Verify alert was created with pending_sync status
      expect(alert.syncStatus).toBe('pending_sync');

      // Verify alert was queued in localStorage
      const queue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(queue).toHaveLength(1);
      expect(queue[0].alertId).toBe(alert.id);
      expect(queue[0].notificationPending).toBe(true);

      // Verify API was NOT called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should queue alert when sync fails', async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Network error',
        }),
      });

      const alert = await service.createStopWorkAlert(mockRequest);

      // Verify alert was queued despite being online
      const queue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(queue).toHaveLength(1);
      expect(queue[0].alertId).toBe(alert.id);
    });

    it('should generate unique alert IDs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      const alert1 = await service.createStopWorkAlert(mockRequest);
      const alert2 = await service.createStopWorkAlert(mockRequest);

      expect(alert1.id).not.toBe(alert2.id);
      expect(alert1.id).toMatch(/^stopwork_\d+_[a-z0-9]+$/);
      expect(alert2.id).toMatch(/^stopwork_\d+_[a-z0-9]+$/);
    });
  });

  describe('syncPendingAlerts', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      await service.syncPendingAlerts();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should sync all pending alerts when online', async () => {
      // Queue some alerts
      const queue = [
        {
          alertId: 'alert-1',
          alertData: {
            id: 'alert-1',
            lmraId: 'lmra-1',
            triggeredBy: 'user-1',
            triggeredByName: 'User 1',
            reason: 'Test 1',
            severity: 'high',
            category: 'hazard',
            description: 'Test description 1',
            photoIds: [],
            signature: {
              signerId: 'user-1',
              signerName: 'User 1',
              signatureData: 'sig-1',
            },
          },
          timestamp: Date.now(),
          retryCount: 0,
          notificationPending: true,
        },
        {
          alertId: 'alert-2',
          alertData: {
            id: 'alert-2',
            lmraId: 'lmra-2',
            triggeredBy: 'user-2',
            triggeredByName: 'User 2',
            reason: 'Test 2',
            severity: 'critical',
            category: 'equipment',
            description: 'Test description 2',
            photoIds: [],
            signature: {
              signerId: 'user-2',
              signerName: 'User 2',
              signatureData: 'sig-2',
            },
          },
          timestamp: Date.now(),
          retryCount: 0,
          notificationPending: true,
        },
      ];
      localStorageMock.setItem('stopwork-queue', JSON.stringify(queue));

      // Mock successful API responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await service.syncPendingAlerts();

      // Verify both alerts were synced
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Verify queue is now empty
      const updatedQueue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(updatedQueue).toHaveLength(0);
    });

    it('should retry failed alerts up to 3 times', async () => {
      const queue = [
        {
          alertId: 'alert-1',
          alertData: {
            id: 'alert-1',
            lmraId: 'lmra-1',
            triggeredBy: 'user-1',
            triggeredByName: 'User 1',
            reason: 'Test',
            severity: 'high',
            category: 'hazard',
            description: 'Test description',
            photoIds: [],
            signature: {
              signerId: 'user-1',
              signerName: 'User 1',
              signatureData: 'sig-1',
            },
          },
          timestamp: Date.now(),
          retryCount: 0,
          notificationPending: true,
        },
      ];
      localStorageMock.setItem('stopwork-queue', JSON.stringify(queue));

      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Server error' }),
      });

      // First sync attempt
      await service.syncPendingAlerts();
      let updatedQueue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(updatedQueue[0].retryCount).toBe(1);

      // Second sync attempt
      await service.syncPendingAlerts();
      updatedQueue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(updatedQueue[0].retryCount).toBe(2);

      // Third sync attempt (should be removed after this)
      await service.syncPendingAlerts();
      updatedQueue = JSON.parse(localStorageMock.getItem('stopwork-queue') || '[]');
      expect(updatedQueue).toHaveLength(0); // Removed after 3 retries
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await service.acknowledgeAlert('alert-123', 'user-456');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stop-work/alert-123/acknowledge',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user-456' }),
        })
      );
    });

    it('should throw error when acknowledgement fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        service.acknowledgeAlert('alert-123', 'user-456')
      ).rejects.toThrow('Failed to acknowledge alert');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await service.resolveAlert('alert-123', 'Issue has been fixed');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stop-work/alert-123/resolve',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolutionNotes: 'Issue has been fixed' }),
        })
      );
    });

    it('should throw error when resolution fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        service.resolveAlert('alert-123', 'Notes')
      ).rejects.toThrow('Failed to resolve alert');
    });
  });

  describe('getActiveAlerts', () => {
    it('should fetch active alerts successfully', async () => {
      const mockAlerts = [
        { id: 'alert-1', status: 'active' },
        { id: 'alert-2', status: 'active' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAlerts }),
      });

      const alerts = await service.getActiveAlerts('org-123');

      expect(alerts).toEqual(mockAlerts);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stop-work?organizationId=org-123&status=active'
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        service.getActiveAlerts('org-123')
      ).rejects.toThrow('Failed to fetch active alerts');
    });
  });

  describe('getPendingStopWorkAlerts', () => {
    it('should return pending alerts from queue', async () => {
      const queue = [
        {
          alertId: 'alert-1',
          alertData: { id: 'alert-1', status: 'active' },
          timestamp: Date.now(),
          retryCount: 0,
          notificationPending: true,
        },
        {
          alertId: 'alert-2',
          alertData: { id: 'alert-2', status: 'active' },
          timestamp: Date.now(),
          retryCount: 1,
          notificationPending: true,
        },
      ];
      localStorageMock.setItem('stopwork-queue', JSON.stringify(queue));

      const pending = await service.getPendingStopWorkAlerts();

      expect(pending).toHaveLength(2);
      expect(pending[0].id).toBe('alert-1');
      expect(pending[1].id).toBe('alert-2');
    });

    it('should return empty array when no pending alerts', async () => {
      const pending = await service.getPendingStopWorkAlerts();
      expect(pending).toEqual([]);
    });
  });

  describe('getStopWorkService singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getStopWorkService();
      const instance2 = getStopWorkService();

      expect(instance1).toBe(instance2);
    });
  });
});