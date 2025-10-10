/**
 * Optimized Firebase Query Patterns
 *
 * Provides optimized query functions with:
 * - Intelligent caching
 * - Field selection
 * - Pagination optimization
 * - Performance monitoring
 */

import { initializeAdmin } from "@/lib/server-helpers";
import {
  cachedQuery,
  generateCacheKey,
  traCache,
  templateCache,
  lmraCache,
  invalidateCollection,
  invalidateDocument,
} from "./firebase-cache-wrapper";

interface PaginationOptions {
  pageSize?: number;
  cursor?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

interface FieldSelection {
  fields?: string[]; // Specific fields to return
  excludeFields?: string[]; // Fields to exclude
}

/**
 * Optimized TRA list query with caching and field selection
 */
export async function getOptimizedTRAList(
  orgId: string,
  filters: Record<string, any> = {},
  pagination: PaginationOptions = {},
  fieldSelection: FieldSelection = {}
) {
  const { firestore } = initializeAdmin();

  const pageSize = Math.min(pagination.pageSize || 25, 200);
  const sortBy = pagination.sortBy || "createdAt";
  const sortDir = pagination.sortDir || "desc";

  // Generate cache key
  const cacheKey = generateCacheKey(`tras:${orgId}`, filters, {
    pageSize,
    sortBy,
    sortDir,
    cursor: pagination.cursor,
  });

  return cachedQuery(
    async () => {
      let ref = firestore.collection(`organizations/${orgId}/tras`).where("isActive", "==", true);

      // Apply filters
      if (filters.projectId) {
        ref = ref.where("projectId", "==", filters.projectId);
      }
      if (filters.status && Array.isArray(filters.status)) {
        ref = ref.where("status", "in", filters.status);
      }
      if (filters.overallRiskLevel && Array.isArray(filters.overallRiskLevel)) {
        ref = ref.where("overallRiskLevel", "in", filters.overallRiskLevel);
      }
      if (filters.templateId) {
        ref = ref.where("templateId", "==", filters.templateId);
      }
      if (filters.createdBy) {
        ref = ref.where("createdBy", "==", filters.createdBy);
      }

      // Apply sorting
      ref = ref.orderBy(sortBy as any, sortDir as any);

      // Apply pagination
      if (pagination.cursor) {
        const cursorDoc = await firestore
          .collection(`organizations/${orgId}/tras`)
          .doc(pagination.cursor)
          .get();
        if (cursorDoc.exists) {
          ref = ref.startAfter(cursorDoc);
        }
      }

      // Fetch with limit + 1 to check for more results
      const snap = await ref.limit(pageSize + 1).get();
      const docs = snap.docs;

      // Process results with field selection
      let items = docs.map((d: any) => {
        const data = d.data();
        return selectFields({ id: d.id, ...data }, fieldSelection);
      });

      // Determine pagination
      const hasMore = items.length > pageSize;
      if (hasMore) items = items.slice(0, pageSize);
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return {
        items,
        nextCursor,
        hasMore,
        totalCount: undefined, // Expensive in Firestore
      };
    },
    cacheKey,
    { cache: traCache, ttl: 5 * 60 * 1000 } // 5 minutes
  );
}

/**
 * Optimized single TRA fetch with caching
 */
export async function getOptimizedTRA(
  orgId: string,
  traId: string,
  fieldSelection: FieldSelection = {}
) {
  const { firestore } = initializeAdmin();

  const cacheKey = generateCacheKey(
    `tras:${orgId}`,
    { id: traId },
    { fields: fieldSelection.fields?.join(",") }
  );

  return cachedQuery(
    async () => {
      const doc = await firestore.collection(`organizations/${orgId}/tras`).doc(traId).get();

      if (!doc.exists) {
        return null;
      }

      const data = { id: doc.id, ...doc.data() };
      return selectFields(data, fieldSelection);
    },
    cacheKey,
    { cache: traCache, ttl: 5 * 60 * 1000 }
  );
}

/**
 * Optimized template list query
 */
export async function getOptimizedTemplateList(
  orgId: string,
  filters: Record<string, any> = {},
  pagination: PaginationOptions = {},
  fieldSelection: FieldSelection = {}
) {
  const { firestore } = initializeAdmin();

  const pageSize = Math.min(pagination.pageSize || 50, 200);

  const cacheKey = generateCacheKey(`templates:${orgId}`, filters, {
    pageSize,
    cursor: pagination.cursor,
  });

  return cachedQuery(
    async () => {
      let ref = firestore
        .collection(`organizations/${orgId}/traTemplates`)
        .where("isActive", "==", true);

      // Apply filters
      if (filters.industryCategory) {
        ref = ref.where("industryCategory", "==", filters.industryCategory);
      }
      if (filters.vcaCertified !== undefined) {
        ref = ref.where("vcaCertified", "==", filters.vcaCertified);
      }
      if (filters.status) {
        ref = ref.where("status", "==", filters.status);
      }
      if (filters.complianceFramework) {
        ref = ref.where("complianceFramework", "==", filters.complianceFramework);
      }
      if (filters.language) {
        ref = ref.where("language", "==", filters.language);
      }

      // Order by creation date
      ref = ref.orderBy("createdAt", "desc");

      // Apply pagination
      if (pagination.cursor) {
        const cursorDoc = await firestore
          .collection(`organizations/${orgId}/traTemplates`)
          .doc(pagination.cursor)
          .get();
        if (cursorDoc.exists) {
          ref = ref.startAfter(cursorDoc);
        }
      }

      const snap = await ref.limit(pageSize + 1).get();
      const docs = snap.docs;

      let items = docs.map((d: any) => {
        const data = d.data();
        return selectFields({ id: d.id, ...data }, fieldSelection);
      });

      const hasMore = items.length > pageSize;
      if (hasMore) items = items.slice(0, pageSize);
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return {
        items,
        nextCursor,
        hasMore,
      };
    },
    cacheKey,
    { cache: templateCache, ttl: 15 * 60 * 1000 } // 15 minutes (templates change less)
  );
}

/**
 * Optimized LMRA sessions query
 */
export async function getOptimizedLMRAList(
  orgId: string,
  filters: Record<string, any> = {},
  pagination: PaginationOptions = {},
  fieldSelection: FieldSelection = {}
) {
  const { firestore } = initializeAdmin();

  const pageSize = Math.min(pagination.pageSize || 50, 200);
  const sortBy = pagination.sortBy || "startedAt";
  const sortDir = pagination.sortDir || "desc";

  const cacheKey = generateCacheKey(`lmraSessions:${orgId}`, filters, {
    pageSize,
    sortBy,
    sortDir,
    cursor: pagination.cursor,
  });

  return cachedQuery(
    async () => {
      let ref: any = firestore.collection(`organizations/${orgId}/lmraSessions`);

      // Apply filters
      if (filters.traId) {
        ref = ref.where("traId", "==", filters.traId);
      }
      if (filters.projectId) {
        ref = ref.where("projectId", "==", filters.projectId);
      }
      if (filters.performedBy) {
        ref = ref.where("performedBy", "==", filters.performedBy);
      }
      if (filters.overallAssessment) {
        ref = ref.where("overallAssessment", "==", filters.overallAssessment);
      }
      if (filters.syncStatus) {
        ref = ref.where("syncStatus", "==", filters.syncStatus);
      }

      // Apply sorting
      ref = ref.orderBy(sortBy as any, sortDir as any);

      // Apply pagination
      if (pagination.cursor) {
        const cursorDoc = await firestore
          .collection(`organizations/${orgId}/lmraSessions`)
          .doc(pagination.cursor)
          .get();
        if (cursorDoc.exists) {
          ref = ref.startAfter(cursorDoc);
        }
      }

      const snap = await ref.limit(pageSize + 1).get();
      const docs = snap.docs;

      let items = docs.map((d: any) => {
        const data = d.data();
        return selectFields({ id: d.id, ...data }, fieldSelection);
      });

      const hasMore = items.length > pageSize;
      if (hasMore) items = items.slice(0, pageSize);
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return {
        items,
        nextCursor,
        hasMore,
      };
    },
    cacheKey,
    { cache: lmraCache, ttl: 2 * 60 * 1000 } // 2 minutes (more real-time)
  );
}

/**
 * Batch fetch TRAs by IDs with caching
 */
export async function batchGetTRAs(
  orgId: string,
  traIds: string[],
  fieldSelection: FieldSelection = {}
) {
  const { firestore } = initializeAdmin();

  // Check cache first
  const results: any[] = [];
  const uncachedIds: string[] = [];

  for (const traId of traIds) {
    const cacheKey = generateCacheKey(`tras:${orgId}`, { id: traId });
    const cached = traCache.get(cacheKey);

    if (cached) {
      results.push(selectFields(cached, fieldSelection));
    } else {
      uncachedIds.push(traId);
      results.push(null); // Placeholder
    }
  }

  // Fetch uncached in batch
  if (uncachedIds.length > 0) {
    const docs = await Promise.all(
      uncachedIds.map((id) => firestore.collection(`organizations/${orgId}/tras`).doc(id).get())
    );

    let uncachedIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) {
        const doc = docs[uncachedIndex];
        if (doc.exists) {
          const data = { id: doc.id, ...doc.data() };
          const cacheKey = generateCacheKey(`tras:${orgId}`, { id: doc.id });
          traCache.set(cacheKey, data);
          results[i] = selectFields(data, fieldSelection);
        }
        uncachedIndex++;
      }
    }
  }

  return results.filter((r) => r !== null);
}

/**
 * Helper: Select specific fields from document
 */
function selectFields(doc: any, selection: FieldSelection): any {
  if (!selection.fields && !selection.excludeFields) {
    return doc;
  }

  const result: any = {};

  if (selection.fields) {
    // Include only specified fields
    for (const field of selection.fields) {
      if (doc[field] !== undefined) {
        result[field] = doc[field];
      }
    }
    // Always include id
    if (doc.id) result.id = doc.id;
  } else if (selection.excludeFields) {
    // Include all except excluded fields
    for (const key in doc) {
      if (!selection.excludeFields.includes(key)) {
        result[key] = doc[key];
      }
    }
  }

  return result;
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate TRA cache after mutation
   */
  invalidateTRA: (orgId: string, traId?: string) => {
    if (traId) {
      invalidateDocument("tras", orgId, traId);
    } else {
      invalidateCollection("tras", orgId);
    }
  },

  /**
   * Invalidate template cache after mutation
   */
  invalidateTemplate: (orgId: string, templateId?: string) => {
    if (templateId) {
      invalidateDocument("templates", orgId, templateId);
    } else {
      invalidateCollection("templates", orgId);
    }
  },

  /**
   * Invalidate LMRA cache after mutation
   */
  invalidateLMRA: (orgId: string, sessionId?: string) => {
    if (sessionId) {
      invalidateDocument("lmraSessions", orgId, sessionId);
    } else {
      invalidateCollection("lmraSessions", orgId);
    }
  },

  /**
   * Invalidate project-related caches
   */
  invalidateProject: (orgId: string, projectId: string) => {
    traCache.invalidatePattern(`tras:${orgId}.*projectId:"${projectId}"`);
    lmraCache.invalidatePattern(`lmraSessions:${orgId}.*projectId:"${projectId}"`);
  },
};
