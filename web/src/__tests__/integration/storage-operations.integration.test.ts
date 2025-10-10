/**
 * Firebase Storage Operations Integration Tests
 * Tests file upload, download, and management using Firebase Emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  getBytes,
} from "firebase/storage";
import { initializeEmulatorApp, clearEmulatorData } from "../../lib/firebase-emulator";

describe("Storage Operations Integration Tests", () => {
  let storage: any;
  const testOrgId = "test-org-123";

  beforeAll(async () => {
    const services = initializeEmulatorApp();
    storage = services.storage;
  });

  beforeEach(async () => {
    await clearEmulatorData();
  });

  afterAll(async () => {
    await clearEmulatorData();
  });

  // Skip tests if storage is not available in emulator
  const describeIfStorage = storage ? describe : describe.skip;

  describeIfStorage("File Upload", () => {
    it("should upload a file from bytes", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);
      const fileData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

      const snapshot = await uploadBytes(fileRef, fileData);

      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.metadata.name).toBe("test-file.txt");
      expect(snapshot.metadata.size).toBe(5);
    });

    it("should upload a file from string", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-string.txt`);
      const content = "Hello, World!";

      const snapshot = await uploadString(fileRef, content);

      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.metadata.name).toBe("test-string.txt");
    });

    it("should upload with custom metadata", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-meta.txt`);
      const fileData = new Uint8Array([72, 101, 108, 108, 111]);
      const metadata = {
        contentType: "text/plain",
        customMetadata: {
          uploadedBy: "test-user",
          projectId: "project-123",
        },
      };

      const snapshot = await uploadBytes(fileRef, fileData, metadata);

      expect(snapshot.metadata.contentType).toBe("text/plain");
      expect(snapshot.metadata.customMetadata?.uploadedBy).toBe("test-user");
    });

    it("should upload image file", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/images/test-image.jpg`);
      // Minimal JPEG header
      const jpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const metadata = {
        contentType: "image/jpeg",
      };

      const snapshot = await uploadBytes(fileRef, jpegData, metadata);

      expect(snapshot.metadata.contentType).toBe("image/jpeg");
    });
  });

  describeIfStorage("File Download", () => {
    beforeEach(async () => {
      // Upload a test file
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);
      const fileData = new Uint8Array([72, 101, 108, 108, 111]);
      await uploadBytes(fileRef, fileData);
    });

    it("should get download URL", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);

      const url = await getDownloadURL(fileRef);

      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
      expect(url).toContain("test-file.txt");
    });

    it("should download file bytes", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);

      const bytes = await getBytes(fileRef);

      expect(bytes).toBeDefined();
      expect(bytes.byteLength).toBe(5);
      // Check if it's "Hello"
      expect(Array.from(new Uint8Array(bytes))).toEqual([72, 101, 108, 108, 111]);
    });

    it("should fail to download non-existent file", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/non-existent.txt`);

      await expect(getDownloadURL(fileRef)).rejects.toThrow();
    });
  });

  describeIfStorage("File Metadata", () => {
    beforeEach(async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);
      const fileData = new Uint8Array([72, 101, 108, 108, 111]);
      const metadata = {
        contentType: "text/plain",
        customMetadata: {
          uploadedBy: "test-user",
        },
      };
      await uploadBytes(fileRef, fileData, metadata);
    });

    it("should get file metadata", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);

      const metadata = await getMetadata(fileRef);

      expect(metadata.name).toBe("test-file.txt");
      expect(metadata.size).toBe(5);
      expect(metadata.contentType).toBe("text/plain");
      expect(metadata.customMetadata?.uploadedBy).toBe("test-user");
    });

    it("should update file metadata", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);

      const newMetadata = {
        customMetadata: {
          uploadedBy: "updated-user",
          status: "processed",
        },
      };

      const updatedMetadata = await updateMetadata(fileRef, newMetadata);

      expect(updatedMetadata.customMetadata?.uploadedBy).toBe("updated-user");
      expect(updatedMetadata.customMetadata?.status).toBe("processed");
    });
  });

  describeIfStorage("File Deletion", () => {
    beforeEach(async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);
      const fileData = new Uint8Array([72, 101, 108, 108, 111]);
      await uploadBytes(fileRef, fileData);
    });

    it("should delete a file", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/test-file.txt`);

      await deleteObject(fileRef);

      // File should no longer exist
      await expect(getMetadata(fileRef)).rejects.toThrow();
    });

    it("should fail to delete non-existent file", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/uploads/non-existent.txt`);

      await expect(deleteObject(fileRef)).rejects.toThrow();
    });
  });

  describeIfStorage("Directory Operations", () => {
    beforeEach(async () => {
      // Upload multiple files
      const files = ["file1.txt", "file2.txt", "file3.txt"];
      for (const fileName of files) {
        const fileRef = ref(storage, `organizations/${testOrgId}/uploads/${fileName}`);
        const fileData = new Uint8Array([72, 101, 108, 108, 111]);
        await uploadBytes(fileRef, fileData);
      }
    });

    it("should list all files in directory", async () => {
      const dirRef = ref(storage, `organizations/${testOrgId}/uploads`);

      const result = await listAll(dirRef);

      expect(result.items.length).toBe(3);
      expect(result.items.map((item) => item.name).sort()).toEqual([
        "file1.txt",
        "file2.txt",
        "file3.txt",
      ]);
    });

    it("should handle empty directory", async () => {
      const dirRef = ref(storage, `organizations/${testOrgId}/empty-dir`);

      const result = await listAll(dirRef);

      expect(result.items.length).toBe(0);
    });
  });

  describeIfStorage("Multi-tenant Isolation", () => {
    it("should isolate files between organizations", async () => {
      // Upload to org1
      const org1Ref = ref(storage, "organizations/org-1/uploads/file.txt");
      await uploadBytes(org1Ref, new Uint8Array([1, 2, 3]));

      // Upload to org2
      const org2Ref = ref(storage, "organizations/org-2/uploads/file.txt");
      await uploadBytes(org2Ref, new Uint8Array([4, 5, 6]));

      // Verify both exist independently
      const org1Metadata = await getMetadata(org1Ref);
      const org2Metadata = await getMetadata(org2Ref);

      expect(org1Metadata.fullPath).toContain("org-1");
      expect(org2Metadata.fullPath).toContain("org-2");
    });

    it("should list only organization-specific files", async () => {
      await uploadBytes(ref(storage, "organizations/org-1/uploads/file1.txt"), new Uint8Array([1]));
      await uploadBytes(ref(storage, "organizations/org-1/uploads/file2.txt"), new Uint8Array([2]));
      await uploadBytes(ref(storage, "organizations/org-2/uploads/file1.txt"), new Uint8Array([3]));

      const org1List = await listAll(ref(storage, "organizations/org-1/uploads"));
      const org2List = await listAll(ref(storage, "organizations/org-2/uploads"));

      expect(org1List.items.length).toBe(2);
      expect(org2List.items.length).toBe(1);
    });
  });

  describeIfStorage("File Type Handling", () => {
    it("should handle text files", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/documents/doc.txt`);
      const content = "This is a text document";

      await uploadString(fileRef, content, "raw", {
        contentType: "text/plain",
      });

      const metadata = await getMetadata(fileRef);
      expect(metadata.contentType).toBe("text/plain");
    });

    it("should handle JSON files", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/data/data.json`);
      const jsonData = JSON.stringify({ key: "value", number: 42 });

      await uploadString(fileRef, jsonData, "raw", {
        contentType: "application/json",
      });

      const metadata = await getMetadata(fileRef);
      expect(metadata.contentType).toBe("application/json");
    });

    it("should handle PDF files", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/reports/report.pdf`);
      // Minimal PDF header
      const pdfData = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

      await uploadBytes(fileRef, pdfData, {
        contentType: "application/pdf",
      });

      const metadata = await getMetadata(fileRef);
      expect(metadata.contentType).toBe("application/pdf");
    });
  });

  describeIfStorage("Large File Handling", () => {
    it("should handle files larger than 1KB", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/large/large-file.bin`);
      // Create 10KB file
      const largeData = new Uint8Array(10 * 1024).fill(42);

      const snapshot = await uploadBytes(fileRef, largeData);

      expect(snapshot.metadata.size).toBe(10 * 1024);
    });
  });

  describeIfStorage("Error Handling", () => {
    it("should handle invalid file paths", async () => {
      const invalidRef = ref(storage, ""); // Empty path

      await expect(uploadBytes(invalidRef, new Uint8Array([1, 2, 3]))).rejects.toThrow();
    });

    it("should handle operations on deleted files", async () => {
      const fileRef = ref(storage, `organizations/${testOrgId}/temp/temp-file.txt`);
      await uploadBytes(fileRef, new Uint8Array([1, 2, 3]));
      await deleteObject(fileRef);

      await expect(getMetadata(fileRef)).rejects.toThrow();
      await expect(getDownloadURL(fileRef)).rejects.toThrow();
    });
  });

  describeIfStorage("Concurrent Operations", () => {
    it("should handle multiple simultaneous uploads", async () => {
      const uploads = [];
      for (let i = 0; i < 5; i++) {
        const fileRef = ref(storage, `organizations/${testOrgId}/concurrent/file${i}.txt`);
        uploads.push(uploadBytes(fileRef, new Uint8Array([i])));
      }

      const results = await Promise.all(uploads);

      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        expect(result.metadata.name).toBe(`file${index}.txt`);
      });
    });

    it("should handle multiple simultaneous downloads", async () => {
      // Upload files first
      for (let i = 0; i < 3; i++) {
        const fileRef = ref(storage, `organizations/${testOrgId}/download/file${i}.txt`);
        await uploadBytes(fileRef, new Uint8Array([i]));
      }

      // Download simultaneously
      const downloads = [];
      for (let i = 0; i < 3; i++) {
        const fileRef = ref(storage, `organizations/${testOrgId}/download/file${i}.txt`);
        downloads.push(getDownloadURL(fileRef));
      }

      const urls = await Promise.all(downloads);

      expect(urls.length).toBe(3);
      urls.forEach((url) => {
        expect(typeof url).toBe("string");
      });
    });
  });
});
