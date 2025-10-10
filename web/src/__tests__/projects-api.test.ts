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

// Mock server helpers
jest.mock("@/lib/server-helpers", () => ({
  requireOrgAuth: jest.fn(),
  initializeAdmin: jest.fn(() => ({
    firestore: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            add: jest.fn(),
            where: jest.fn(() => ({
              get: jest.fn(),
              orderBy: jest.fn(() => ({
                get: jest.fn(),
              })),
            })),
          })),
          get: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        add: jest.fn(),
        where: jest.fn(() => ({
          get: jest.fn(),
          orderBy: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
    },
  })),
}));

// Mock audit logging
jest.mock("@/lib/audit", () => ({
  writeAuditLog: jest.fn(),
}));

// Import after mocking
import { POST, GET } from "@/app/api/projects/route";
import { requireOrgAuth, initializeAdmin } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";

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
      (requireOrgAuth as jest.Mock).mockResolvedValue(mockUser);

      // Mock Firestore operations
      const mockDocRef = {
        id: "new-project-id",
        get: jest.fn().mockResolvedValue({
          data: () => mockProject,
        }),
      };

      const mockCollection = {
        add: jest.fn().mockResolvedValue(mockDocRef),
        doc: jest.fn(),
      };

      (initializeAdmin as jest.Mock).mockReturnValue({
        firestore: {
          collection: jest.fn(() => ({
            doc: jest.fn(() => mockCollection),
          })),
        },
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

      expect(requireOrgAuth).toHaveBeenCalledWith(request);
      expect(initializeAdmin).toHaveBeenCalled();
      expect(writeAuditLog).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(result.data.id).toBe("new-project-id");
    });

    it("should handle authentication errors", async () => {
      (requireOrgAuth as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should validate required fields", async () => {
      (requireOrgAuth as jest.Mock).mockResolvedValue(mockUser);

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
      (requireOrgAuth as jest.Mock).mockResolvedValue(mockUser);

      // Mock Firestore query results
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: "project1",
            data: () => ({ ...mockProject, id: "project1" }),
          });
          callback({
            id: "project2",
            data: () => ({ ...mockProject, id: "project2" }),
          });
        }),
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      };

      const mockCollection = {
        where: jest.fn(() => mockQuery),
      };

      (initializeAdmin as jest.Mock).mockReturnValue({
        firestore: {
          collection: jest.fn(() => ({
            doc: jest.fn(() => mockCollection),
          })),
        },
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);
      const result = await response.json();

      expect(requireOrgAuth).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      expect(result.data.projects).toHaveLength(2);
      expect(result.data.projects[0].id).toBe("project1");
    });

    it("should handle empty project list", async () => {
      (requireOrgAuth as jest.Mock).mockResolvedValue(mockUser);

      const mockQuerySnapshot = {
        forEach: jest.fn(), // Empty, no callback calls
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      };

      (initializeAdmin as jest.Mock).mockReturnValue({
        firestore: {
          collection: jest.fn(() => ({
            where: jest.fn(() => mockQuery),
          })),
        },
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.projects).toHaveLength(0);
    });

    it("should handle Firestore errors", async () => {
      (requireOrgAuth as jest.Mock).mockResolvedValue(mockUser);

      (initializeAdmin as jest.Mock).mockReturnValue({
        firestore: {
          collection: jest.fn(() => ({
            where: jest.fn(() => ({
              orderBy: jest.fn(() => ({
                get: jest.fn().mockRejectedValue(new Error("Firestore error")),
              })),
            })),
          })),
        },
      });

      const request = new Request("http://localhost:3000/api/projects");

      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
