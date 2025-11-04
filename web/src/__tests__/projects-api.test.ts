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
  });

  describe("POST /api/projects", () => {
    it("should create a new project successfully", async () => {
      // Mock authenticated user
      mockRequireOrgAuth.mockResolvedValue(mockUser);

      // Mock Firestore operations
      const mockDocRef = {
        id: "new-project-id",
        get: jest.fn().mockResolvedValue({
          data: () => mockProject,
        }),
      };

      // Ensure the in-memory firestore is clean and then attach a projects collection under the expected path
      (global as any).resetMockFirestore();

      // Create a deterministic doc id that the route will receive from add()
      const createdId = "new-project-id";
      const orgPath = `organizations/${mockUser.orgId}/projects`;
      const docKey = `${orgPath}/${createdId}`;

      // Put the saved project snapshot into the in-memory DB so snap.data() returns expected data
      (global as any).mockFirestore._data[docKey] = { ...mockProject };

      // Override collection(...).doc(orgId).collection('projects').add to return a docRef with id and get()
      const origCollection = (global as any).mockFirestore.collection.bind((global as any).mockFirestore);
      (global as any).mockFirestore.collection = (path: string) => {
        const col = origCollection(path);
        // When asking for the org path, return an object whose doc(id).collection returns the projects collection
        if (path === `organizations`) {
          return {
            doc: (id: string) => {
              return {
                collection: (sub: string) => {
                  if (sub === "projects") {
                    return {
                      add: async (data: any) => {
                        // write data to in-memory db at createdId
                        const id = createdId;
                        const key = `${orgPath}/${id}`;
                        (global as any).mockFirestore._data[key] = data;
                        return { id, get: async () => ({ exists: true, data: () => (global as any).mockFirestore._data[key] }) };
                      },
                      where: col.where,
                      orderBy: col.orderBy,
                      get: col.get,
                    };
                  }
                  return origCollection(`${path}/${id}/${sub}`);
                },
              };
            },
            where: col.where,
            add: col.add,
          };
        }
        return col;
      };

      // Ensure initializeAdmin returns the global mockFirestore
      mockInitializeAdmin.mockReturnValue({
        firestore: (global as any).mockFirestore,
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

      // Ensure the global fetch stub (from jest.setup) is intact and reset DB state
      (global as any).resetMockFirestore();
      // initializeAdmin will return global.mockFirestore as configured earlier
      mockInitializeAdmin.mockReturnValue({ firestore: (global as any).mockFirestore, admin: {} as any });

      const response = await POST(request);
      const result = await response.json();

      expect(mockRequireOrgAuth).toHaveBeenCalledWith(request);
      expect(mockInitializeAdmin).toHaveBeenCalled();
      expect(mockWriteAuditLog).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(result.id).toBe("new-project-id");
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
        createdAt: new Date("2024-01-01")
      };
      const project2Data = { 
        name: "Project 2",
        deleted: false,
        createdAt: new Date("2024-01-02")
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
