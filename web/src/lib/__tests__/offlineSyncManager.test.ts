/**
 * Unit tests for OfflineSyncManager
 * W1.6: Offline Sync Implementation
 */

import { OfflineSyncManager, getOfflineSyncManager } from '../offlineSyncManager';
import { LMRASession } from '../types/lmra';
import { openDB } from 'idb';

// Mock idb
jest.mock('idb', () => ({
  openDB: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('OfflineSyncManager', () => {
  let manager: OfflineSyncManager;
  let mockDB: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock IndexedDB
    mockDB = {
      put: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(undefined),
      getAll: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    };

    // Mock openDB to return our mock DB
    (openDB as jest.Mock).mockResolvedValue(mockDB);

    manager = new OfflineSyncManager();
    
    // Set online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (global.fetch as jest.Mock).mockClear();
  });

  describe('initialize', () => {
    it('should initialize IndexedDB successfully', async () => {
      await manager.initialize();

      expect(openDB).toHaveBeenCalledWith(
        'safework-pro-offline',
        1,
        expect.any(Object)
      );
    });

    it('should not reinitialize if already initialized', async () => {
      await manager.initialize();
      await manager.initialize();

      expect(openDB).toHaveBeenCalledTimes(1);
    });
  });

  describe('queueLMRASession', () => {
    const mockSession: LMRASession = {
      id: 'session-123',
      organizationId: 'org-123',
      projectId: 'project-123',
      traId: 'tra-123',
      status: 'in_progress',
      currentStep: 1,
      createdBy: 'user-123',
      createdAt: new Date(),
      startedAt: new Date(),
      syncStatus: 'synced',
    };

    it('should queue LMRA session for sync', async () => {
      await manager.queueLMRASession('session-123', mockSession, 'create');

      expect(mockDB.put).toHaveBeenCalledWith(
        'lmraSessions',
        expect.objectContaining({
          sessionId: 'session-123',
          operation: 'create',
          retryCount: 0,
          sessionData: expect.objectContaining({
            ...mockSession,
            syncStatus: 'pending_sync',
          }),
        })
      );
    });

    it('should attempt immediate sync when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      mockDB.getAll.mockResolvedValueOnce([
        {
          sessionId: 'session-123',
          sessionData: mockSession,
          operation: 'create',
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      await manager.queueLMRASession('session-123', mockSession, 'create');

      // Wait for async sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('queuePhoto', () => {
    it('should queue photo for upload', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

      await manager.queuePhoto(
        'photo-123',
        'session-123',
        mockBlob,
        'test.jpg',
        'hazard',
        'Test caption'
      );

      expect(mockDB.put).toHaveBeenCalledWith(
        'photoQueue',
        expect.objectContaining({
          photoId: 'photo-123',
          sessionId: 'session-123',
          blob: mockBlob,
          filename: 'test.jpg',
          category: 'hazard',
          caption: 'Test caption',
          retryCount: 0,
        })
      );
    });
  });

  describe('getPendingSyncItems', () => {
    it('should return counts of pending items', async () => {
      mockDB.count
        .mockResolvedValueOnce(3) // sessions
        .mockResolvedValueOnce(5) // photos
        .mockResolvedValueOnce(2); // projects

      const counts = await manager.getPendingSyncItems();

      expect(counts).toEqual({
        sessions: 3,
        photos: 5,
        projects: 2,
      });
    });
  });

  describe('syncNow', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      await manager.syncNow();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not start new sync when already in progress', async () => {
      // Mock long-running sync
      mockDB.getAll.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1000))
      );

      const sync1 = manager.syncNow();
      const sync2 = manager.syncNow();

      await Promise.all([sync1, sync2]);

      // Should only call getAll once (for sessions)
      expect(mockDB.getAll).toHaveBeenCalledTimes(1);
    });

    it('should sync all pending items in order', async () => {
      const mockSession = {
        sessionId: 'session-1',
        sessionData: {
          id: 'session-1',
          organizationId: 'org-1',
        },
        operation: 'create',
        timestamp: Date.now(),
        retryCount: 0,
      };

      const mockProject = {
        projectId: 'project-1',
        projectData: { name: 'Test Project' },
        operation: 'create',
        timestamp: Date.now(),
        retryCount: 0,
      };

      const mockPhoto = {
        photoId: 'photo-1',
        sessionId: 'session-1',
        blob: new Blob(['test']),
        filename: 'test.jpg',
        category: 'hazard',
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Mock getAll to return items for each store
      mockDB.getAll
        .mockResolvedValueOnce([mockSession]) // lmraSessions
        .mockResolvedValueOnce([mockProject]) // projectQueue
        .mockResolvedValueOnce([mockPhoto]); // photoQueue

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await manager.syncNow();

      // Verify sync was called for each type
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(mockDB.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('queueProject', () => {
    it('should queue project for sync', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description',
      };

      await manager.queueProject('project-123', projectData, 'create');

      expect(mockDB.put).toHaveBeenCalledWith(
        'projectQueue',
        expect.objectContaining({
          projectId: 'project-123',
          projectData,
          operation: 'create',
          retryCount: 0,
        })
      );
    });

    it('should support different project operations', async () => {
      const operations: Array<'create' | 'update' | 'delete' | 'member_add' | 'member_update' | 'member_remove'> = [
        'create',
        'update',
        'delete',
        'member_add',
        'member_update',
        'member_remove',
      ];

      for (const operation of operations) {
        await manager.queueProject('project-123', {}, operation);
      }

      expect(mockDB.put).toHaveBeenCalledTimes(operations.length);
    });
  });

  describe('retrySession', () => {
    it('should reset retry count and attempt sync', async () => {
      const mockSession = {
        sessionId: 'session-123',
        sessionData: {
          id: 'session-123',
          syncStatus: 'sync_failed',
        },
        operation: 'create',
        timestamp: Date.now(),
        retryCount: 3,
        lastError: 'Network error',
      };

      mockDB.get.mockResolvedValueOnce(mockSession);
      mockDB.getAll.mockResolvedValueOnce([mockSession]);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await manager.retrySession('session-123');

      expect(mockDB.put).toHaveBeenCalledWith(
        'lmraSessions',
        expect.objectContaining({
          sessionId: 'session-123',
          retryCount: 0,
          lastError: undefined,
          sessionData: expect.objectContaining({
            syncStatus: 'pending_sync',
          }),
        })
      );
    });

    it('should throw error when session not found', async () => {
      mockDB.get.mockResolvedValueOnce(undefined);

      await expect(
        manager.retrySession('nonexistent-session')
      ).rejects.toThrow('Session not found in sync queue');
    });
  });

  describe('retryProject', () => {
    it('should reset retry count and attempt sync', async () => {
      const mockProject = {
        projectId: 'project-123',
        projectData: {},
        operation: 'create',
        timestamp: Date.now(),
        retryCount: 3,
        lastError: 'Network error',
      };

      mockDB.get.mockResolvedValueOnce(mockProject);
      mockDB.getAll.mockResolvedValueOnce([mockProject]);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await manager.retryProject('project-123');

      expect(mockDB.put).toHaveBeenCalledWith(
        'projectQueue',
        expect.objectContaining({
          projectId: 'project-123',
          retryCount: 0,
          lastError: undefined,
        })
      );
    });
  });

  describe('clearAllQueues', () => {
    it('should clear all sync queues', async () => {
      await manager.clearAllQueues();

      expect(mockDB.clear).toHaveBeenCalledWith('lmraSessions');
      expect(mockDB.clear).toHaveBeenCalledWith('photoQueue');
      expect(mockDB.clear).toHaveBeenCalledWith('projectQueue');
    });
  });

  describe('getSyncStats', () => {
    it('should return comprehensive sync statistics', async () => {
      // Mock pending counts
      mockDB.count
        .mockResolvedValueOnce(2) // sessions
        .mockResolvedValueOnce(3) // photos
        .mockResolvedValueOnce(1); // projects

      // Mock failed items
      mockDB.getAll
        .mockResolvedValueOnce([
          { sessionId: 's1', retryCount: 3, lastError: 'Error 1' },
          { sessionId: 's2', retryCount: 2 },
        ]) // sessions
        .mockResolvedValueOnce([
          { photoId: 'p1', retryCount: 3 },
        ]) // photos
        .mockResolvedValueOnce([
          { projectId: 'pr1', retryCount: 3 },
        ]); // projects

      // Mock metadata
      mockDB.get
        .mockResolvedValueOnce({ value: 1234567890 }) // lastSyncTime
        .mockResolvedValueOnce({ value: false }); // syncInProgress

      const stats = await manager.getSyncStats();

      expect(stats).toEqual({
        pendingSessions: 2,
        pendingPhotos: 3,
        pendingProjects: 1,
        failedSessions: 1, // Only one with retryCount >= 3
        failedPhotos: 1,
        failedProjects: 1,
        lastSyncTime: 1234567890,
        syncInProgress: false,
      });
    });
  });

  describe('getFailedSyncItems', () => {
    it('should return only items that exceeded max retries', async () => {
      mockDB.getAll
        .mockResolvedValueOnce([
          { sessionId: 's1', retryCount: 3, lastError: 'Error 1' },
          { sessionId: 's2', retryCount: 2, lastError: 'Error 2' },
          { sessionId: 's3', retryCount: 4, lastError: 'Error 3' },
        ])
        .mockResolvedValueOnce([
          { photoId: 'p1', retryCount: 3 },
          { photoId: 'p2', retryCount: 1 },
        ]);

      const failed = await manager.getFailedSyncItems();

      expect(failed.sessions).toHaveLength(2); // s1 and s3
      expect(failed.photos).toHaveLength(1); // p1
      expect(failed.sessions[0].sessionId).toBe('s1');
      expect(failed.sessions[1].sessionId).toBe('s3');
    });
  });

  describe('getOfflineSyncManager singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getOfflineSyncManager();
      const instance2 = getOfflineSyncManager();

      expect(instance1).toBe(instance2);
    });

    it('should setup auto-sync on initialization', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      getOfflineSyncManager();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
    });
  });
});