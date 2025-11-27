/**
 * Project API Tests
 * Comprehensive unit tests for project management API routes
 */

import { jest } from "@jest/globals";

// Mock Next.js modules
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

/**
 * Use the global jest.setup.js Firestore mock for consistency.
 * Replace initializeAdmin mock to return the global.mockFirestore used in jest.setup.js
 * and keep requireOrgAuth as a mock that tests set per-case.
 */
jest.mock("@/lib/server-helpers", () => ({
  requireOrgAuth: jest.fn(),
  initializeAdmin: jest.fn(() => ({ firestore: (global as any).mockFirestore, admin: {} as any })),
}));

// Mock audit logging
jest.mock("@/lib/audit", () => ({
  writeAuditLog: jest.fn(),
}));

// Import after mocking
import { POST, GET } from "@/app/api/projects/route";
import { requireOrgAuth, initializeAdmin } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";

// Type the mocked functions
const mockRequireOrgAuth = requireOrgAuth as jest.MockedFunction<typeof requireOrgAuth>;
const mockInitializeAdmin = initializeAdmin as jest.MockedFunction<typeof initializeAdmin>;
const mockWriteAuditLog = writeAuditLog as jest.MockedFunction<typeof writeAuditLog>;

// Mock data
const mockProject = {
  id: "test-project-id",
  name: "Test Project",
  description: "Test project description",
  slug: "test-project",
  location: {
    address: "Test Address 123",
    city: "Test City",
    country: "Test Country",
  },
  createdBy: "test-user-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  memberCount: 5,
  membersSummary: [
    { uid: "user1", role: "owner", displayName: "User One" },
    { uid: "user2", role: "manager", displayName: "User Two" },
  ],
  stats: {
    trasCount: 10,
    lastActivityAt: new Date(),
  },
};

const mockUser = {
  uid: "test-user-id",
  orgId: "test-org-id",
  roles: ["admin"],
};

describe("/api/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure deterministic Firestore state for each test case
    if (typeof (global as any).resetMockFirestore === "function") {
      (global as any).resetMockFirestore();
    }
  });

  describe("POST /api/projects", () => {
    it("should create a new project successfully", async () => {
      // Mock authenticated user
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      // Minimal org document with usage + subscription fields used by feature-gates.canCreateProject
      const orgData = {
        name: "Test Org",
        subscription: { tier: "professional", status: "active" },
        usage: { projectCount: 0 },
      };

      // Coherent Firestore stub that matches /api/projects route expectations
      const addMock = jest.fn(async (data: any) => {
        // Simulate created project doc
        return {
          id: "new-project-id",
          get: async () => ({
            exists: true,
            data: () => data,
          }),
        };
      });

      const updateMock = jest.fn();

      const mockFirestore = {
        collection: jest.fn((collectionPath: string) => {
          if (collectionPath !== "organizations") {
            throw new Error(`Unexpected collection path: ${collectionPath}`);
          }

          return {
            doc: (orgId: string) => {
              if (orgId !== mockUser.orgId) {
                throw new Error(`Unexpected orgId: ${orgId}`);
              }

              return {
                // Used by route to load org (limits + usage)
                get: async () => ({
                  exists: true,
                  data: () => orgData,
                }),

                // Used by route to increment usage.* fields
                update: updateMock,

                // Used by route to create project sub-documents
                collection: (sub: string) => {
                  if (sub !== "projects") {
                    throw new Error(`Unexpected subcollection: ${sub}`);
                  }
                  return {
                    add: addMock,
                  };
                },
              };
            },
          };
        }),
      } as any;

      // initializeAdmin returns our coherent Firestore mock
      mockInitializeAdmin.mockReturnValue({
        firestore: mockFirestore,
        admin: {} as any,
      });

      const requestBody = {
        name: "New Project",
        description: "New project description",
        location: {
          city: "New City",
          country: "New Country",
        },
      };

      const request = new Request("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const result = await response.json();

      // Assertions: auth + admin init called
      expect(mockRequireOrgAuth).toHaveBeenCalledWith(request);
      expect(mockInitializeAdmin).toHaveBeenCalled();

      // Assertions: project created via add()
      expect(addMock).toHaveBeenCalledTimes(1);

      // Assertions: usage update attempted (best-effort, non-fatal in route)
      expect(updateMock).toHaveBeenCalledTimes(1);
      // Route passes a partial update object; verify it includes the usage.projectCount key
      const updateArg = updateMock.mock.calls[0][0] as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(updateArg, "usage.projectCount")).toBe(true);

      // Assertions: audit log written
      expect(mockWriteAuditLog).toHaveBeenCalledWith(
        mockUser.orgId,
        "new-project-id",
        mockUser.uid,
        "project.create",
        expect.any(Object)
      );

      // Response shape
      expect(response.status).toBe(200);
      expect(result.id).toBe("new-project-id");
      expect(result.name).toBe("New Project");
    });

    it("should handle authentication errors", async () => {
      mockRequireOrgAuth.mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should validate required fields", async () => {
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      const request = new Request("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({}), // Missing required name field
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/projects", () => {
    it("should list projects successfully", async () => {
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      // Pre-populate the in-memory firestore
      (global as any).resetMockFirestore();

      const project1Data = {
        name: "Project 1",
        deleted: false,
        createdAt: new Date("2024-01-01"),
      };
      const project2Data = {
        name: "Project 2",
        deleted: false,
        createdAt: new Date("2024-01-02"),
      };

      // Store at the subcollection path
      const key1 = `organizations/${mockUser.orgId}/projects/project1`;
      const key2 = `organizations/${mockUser.orgId}/projects/project2`;

      (global as any).mockFirestore._data[key1] = project1Data;
      (global as any).mockFirestore._data[key2] = project2Data;

      // Mock the firestore to return a properly structured collection
      const mockQuerySnapshot = {
        forEach: jest.fn((callback: (doc: any) => void) => {
          callback({ id: "project2", data: () => project2Data });
          callback({ id: "project1", data: () => project1Data });
        }),
        empty: false,
        size: 2,
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      };

      const mockSubcollection = {
        where: jest.fn(() => mockQuery),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn(),
      };

      const mockDoc = {
        collection: jest.fn(() => mockSubcollection),
      };

      const mockCollection = {
        doc: jest.fn(() => mockDoc),
      };

      const mockFirestore = {
        collection: jest.fn(() => mockCollection),
      } as any;

      mockInitializeAdmin.mockReturnValue({
        firestore: mockFirestore,
        admin: {} as any,
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);
      const result = await response.json();

      expect(mockRequireOrgAuth).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      expect(result.projects).toHaveLength(2);
      // Projects should be ordered by createdAt desc, so project2 comes first
      expect(result.projects[0].id).toBe("project2");
      expect(result.projects[1].id).toBe("project1");
    });

    it("should handle empty project list", async () => {
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      // Reset firestore to empty state
      (global as any).resetMockFirestore();

      // Ensure initializeAdmin returns the global mockFirestore
      mockInitializeAdmin.mockReturnValue({
        firestore: (global as any).mockFirestore,
        admin: {} as any,
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.projects).toHaveLength(0);
    });

    it("should handle Firestore errors", async () => {
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      // Create a mock firestore that throws an error on query
      const mockFirestoreWithError = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            collection: jest.fn(() => ({
              where: jest.fn(() => ({
                orderBy: jest.fn(() => ({
                  get: jest.fn().mockRejectedValue(new Error("Firestore error")),
                })),
              })),
            })),
          })),
        })),
      } as any;

      mockInitializeAdmin.mockReturnValue({
        firestore: mockFirestoreWithError,
        admin: {} as any,
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
