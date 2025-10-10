/**
 * LMRA Sessions API Routes
 * Handles LMRA session creation, listing, and management
 * Task 5.5: LMRA Execution Workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { CreateLMRARequestSchema, LMRAFiltersSchema } from "@/lib/validators/lmra";
import { LMRASession, ListLMRAResponse } from "@/lib/types/lmra";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  updateDoc,
} from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";

// ============================================================================
// POST /api/lmra-sessions - Create new LMRA session
// ============================================================================

export const POST = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validationResult = CreateLMRARequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        },
        {} as Record<string, string>
      );
      return Errors.validation(errors);
    }

    const data = validationResult.data;

    // Get TRA to verify it exists and is active
    const traRef = doc(db, `organizations/${auth.orgId}/tras`, data.traId);
    const traDoc = await getDoc(traRef);

    if (!traDoc.exists()) {
      return Errors.notFound("TRA");
    }

    const traData = traDoc.data();
    if (traData?.status !== "active" && traData?.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TRA_STATUS",
            message: "TRA must be active or approved to create LMRA session",
          },
        },
        { status: 400 }
      );
    }

    // Get user info for denormalization
    const userRef = doc(db, `organizations/${auth.orgId}/users`, auth.userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Get team members info
    const teamMembersInfo = await Promise.all(
      data.teamMembers.map(async (memberId) => {
        const memberDoc = await getDoc(doc(db, `organizations/${auth.orgId}/users`, memberId));
        const memberData = memberDoc.data();
        return {
          userId: memberId,
          displayName: memberData?.displayName || memberData?.email || memberId,
          role: memberData?.role,
        };
      })
    );

    // Create new LMRA session
    const now = Timestamp.now();
    const sessionRef = doc(collection(db, `organizations/${auth.orgId}/lmraSessions`));

    const newSession: Omit<LMRASession, "id"> = {
      traId: data.traId,
      projectId: data.projectId,
      organizationId: auth.orgId,
      performedBy: auth.userId,
      performedByName: userData?.displayName || userData?.email || auth.userId,
      teamMembers: data.teamMembers,
      teamMembersInfo,
      location: {
        coordinates: new GeoPoint(
          data.location.coordinates.latitude,
          data.location.coordinates.longitude
        ),
        accuracy: data.location.accuracy,
        verificationStatus: data.location.verificationStatus,
        manualOverrideReason: data.location.manualOverrideReason,
        capturedAt: now,
      },
      environmentalChecks: [],
      personnelChecks: [],
      equipmentChecks: [],
      photos: [],
      overallAssessment: "safe_to_proceed", // Default, can be updated
      startedAt: now,
      syncStatus: "synced",
      createdAt: now,
    };

    await setDoc(sessionRef, newSession);

    // Update TRA's LMRA execution count
    await updateDoc(traRef, {
      lmraExecutionCount: (traData?.lmraExecutionCount || 0) + 1,
      lastLMRAExecutedAt: now,
    });

    const response: LMRASession = {
      id: sessionRef.id,
      ...newSession,
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating LMRA session:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to create LMRA session"));
  }
});

// ============================================================================
// GET /api/lmra-sessions - List LMRA sessions with filtering
// ============================================================================

export const GET = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const filters = {
      traId: searchParams.get("traId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      performedBy: searchParams.get("performedBy") || undefined,
      overallAssessment: searchParams.get("overallAssessment") || undefined,
      hasStopWork: searchParams.get("hasStopWork") === "true" || undefined,
      syncStatus: (searchParams.get("syncStatus") as any) || undefined,
    };

    // Pagination
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50"), 200);
    const startAfterId = searchParams.get("startAfter") || undefined;

    // Sorting
    const sortBy = searchParams.get("sortBy") || "startedAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Validate filters
    const filterValidation = LMRAFiltersSchema.safeParse(filters);
    if (!filterValidation.success) {
      const errors = filterValidation.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        },
        {} as Record<string, string>
      );
      return Errors.validation(errors);
    }

    // Build base query
    const baseCollection = collection(db, `organizations/${auth.orgId}/lmraSessions`);
    let queryRef = query(baseCollection, orderBy(sortBy, sortOrder), limit(pageSize));

    // Apply filters
    if (filters.traId) {
      queryRef = query(queryRef, where("traId", "==", filters.traId));
    }
    if (filters.projectId) {
      queryRef = query(queryRef, where("projectId", "==", filters.projectId));
    }
    if (filters.performedBy) {
      queryRef = query(queryRef, where("performedBy", "==", filters.performedBy));
    }
    if (filters.overallAssessment) {
      queryRef = query(queryRef, where("overallAssessment", "==", filters.overallAssessment));
    }
    if (filters.syncStatus) {
      queryRef = query(queryRef, where("syncStatus", "==", filters.syncStatus));
    }

    // Apply cursor pagination
    if (startAfterId) {
      const cursorDoc = await getDoc(
        doc(db, `organizations/${auth.orgId}/lmraSessions`, startAfterId)
      );

      if (cursorDoc.exists()) {
        queryRef = query(queryRef, startAfter(cursorDoc));
      }
    }

    // Execute query
    const snapshot = await getDocs(queryRef);

    // Transform documents
    const items: LMRASession[] = snapshot.docs.map(
      (docSnap) =>
        ({
          id: docSnap.id,
          ...docSnap.data(),
        }) as LMRASession
    );

    // Filter by stop work if needed (client-side filter)
    let filteredItems = items;
    if (filters.hasStopWork !== undefined) {
      filteredItems = items.filter((session) =>
        filters.hasStopWork
          ? session.overallAssessment === "stop_work" || !!session.stopWorkTriggeredBy
          : session.overallAssessment !== "stop_work" && !session.stopWorkTriggeredBy
      );
    }

    const response: ListLMRAResponse = {
      items: filteredItems,
      nextCursor:
        snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1].id : undefined,
      totalCount: snapshot.size,
      hasMore: snapshot.docs.length === pageSize,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Error listing LMRA sessions:", error);
    return Errors.serverError(new Error("Failed to list LMRA sessions"));
  }
});
