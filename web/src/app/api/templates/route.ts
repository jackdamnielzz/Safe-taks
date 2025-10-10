/**
 * Template API Routes - Create and List
 * POST /api/templates - Create new template
 * GET /api/templates - List templates with filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { Errors } from "@/lib/api/errors";
import {
  CreateTemplateRequestSchema,
  TemplateFilterSchema,
  validateSequentialSteps,
  validateVCACompliance,
  sanitizeTemplateData,
} from "@/lib/validators/template";
import type { TRATemplate, CreateTemplateRequest } from "@/lib/types/template";

/**
 * POST /api/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check - only safety_manager and admin can create templates
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();

    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const parseResult = CreateTemplateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        },
        {} as Record<string, string>
      );
      return Errors.validation(errors);
    }

    const data: CreateTemplateRequest = sanitizeTemplateData(parseResult.data);

    // Additional validations
    const stepValidation = validateSequentialSteps(data.taskStepsTemplate);
    if (!stepValidation.valid) {
      return Errors.validation({ steps: stepValidation.error! });
    }

    const vcaValidation = validateVCACompliance({
      vcaCertified: data.vcaCertified || false,
      vcaVersion: data.vcaVersion,
      complianceFramework: data.complianceFramework,
    });
    if (!vcaValidation.valid) {
      return Errors.validation({ vca: vcaValidation.error! });
    }

    // Get user info for denormalization (if available)
    const userDoc = await firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("users")
      .doc(user.uid)
      .get();

    const userData = userDoc.data();
    const createdByName = userData
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
      : "Unknown";

    // Create template document
    const orgTemplatesRef = firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("traTemplates");

    const now = new Date();
    const template = {
      name: data.name,
      description: data.description,
      industryCategory: data.industryCategory,
      hazardCategories: data.hazardCategories,
      tags: data.tags || [],
      complianceFramework: data.complianceFramework,
      vcaCertified: data.vcaCertified || false,
      vcaVersion: data.vcaVersion || null,
      taskStepsTemplate: data.taskStepsTemplate as any, // Type assertion for flexible hazards
      requiredCompetencies: data.requiredCompetencies || [],
      version: 1,
      versionHistory: [
        {
          version: 1,
          versionDate: now,
          versionNotes: "Initiële versie",
          changedBy: user.uid,
          changedByName: createdByName,
        },
      ],
      visibility: "organization",
      isSystemTemplate: false,
      organizationId: user.orgId,
      status: "draft",
      usageCount: 0,
      createdBy: user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
      language: data.language || "nl",
      isActive: true,
      isFeatured: false,
    };

    const docRef = await orgTemplatesRef.add(template);

    // Return created template
    return NextResponse.json(
      {
        id: docRef.id,
        ...template,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating template:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}

/**
 * GET /api/templates
 * List templates with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterParams = {
      industryCategory: searchParams.get("industryCategory") || undefined,
      hazardCategory: searchParams.get("hazardCategory") || undefined,
      vcaCertified:
        searchParams.get("vcaCertified") === "true"
          ? true
          : searchParams.get("vcaCertified") === "false"
            ? false
            : undefined,
      complianceFramework: searchParams.get("complianceFramework") || undefined,
      status: searchParams.get("status") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      searchQuery: searchParams.get("search") || undefined,
      language: searchParams.get("language") || undefined,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 50,
      cursor: searchParams.get("cursor") || undefined,
    };

    const parseResult = TemplateFilterSchema.safeParse(filterParams);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        },
        {} as Record<string, string>
      );
      return Errors.validation(errors);
    }

    const filters = parseResult.data;

    // Build query
    let query: any = firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("traTemplates")
      .where("isActive", "==", true);

    // Apply filters
    if (filters.industryCategory) {
      query = query.where("industryCategory", "==", filters.industryCategory);
    }

    if (filters.vcaCertified !== undefined) {
      query = query.where("vcaCertified", "==", filters.vcaCertified);
    }

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }

    if (filters.complianceFramework) {
      query = query.where("complianceFramework", "==", filters.complianceFramework);
    }

    if (filters.language) {
      query = query.where("language", "==", filters.language);
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc");

    // Apply pagination
    const pageSize = filters.pageSize || 50;
    query = query.limit(pageSize + 1); // Fetch one extra to check if there are more

    if (filters.cursor) {
      const cursorDoc = await firestore
        .collection("organizations")
        .doc(user.orgId)
        .collection("traTemplates")
        .doc(filters.cursor)
        .get();

      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Execute query
    const snapshot = await query.get();

    // Process results
    const templates: TRATemplate[] = [];
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const itemsToReturn = hasMore ? docs.slice(0, pageSize) : docs;

    for (const doc of itemsToReturn) {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
      } as TRATemplate);
    }

    // Apply client-side search filter if provided
    let filteredTemplates = templates;
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      filteredTemplates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Prepare response
    const response = {
      items: filteredTemplates,
      nextCursor: hasMore ? itemsToReturn[itemsToReturn.length - 1].id : undefined,
      totalCount: filteredTemplates.length, // Note: This is page count, not total
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error listing templates:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}
