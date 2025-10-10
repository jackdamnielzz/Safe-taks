/**
 * LMRA Session Completion Endpoint
 * Handles final LMRA session completion with validation
 */

import { NextRequest, NextResponse } from "next/server";
import { CompleteLMRARequestSchema } from "@/lib/validators/lmra";
import { LMRASession } from "@/lib/types/lmra";
import { canCompleteLMRA } from "@/lib/types/lmra";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";

// ============================================================================
// POST /api/lmra-sessions/[id]/complete - Complete LMRA session
// ============================================================================

export const POST = requireAuth(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: sessionId } = await params;

      // Get existing session
      const sessionRef = doc(db, `organizations/${auth.orgId}/lmraSessions`, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return Errors.notFound("LMRA Session");
      }

      const sessionData = sessionDoc.data() as LMRASession;

      // Check if already completed
      if (sessionData.completedAt) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_COMPLETED",
              message: "LMRA session is already completed",
            },
          },
          { status: 400 }
        );
      }

      // Check if user can complete (performer or safety manager+)
      const canComplete =
        sessionData.performedBy === auth.userId ||
        auth.role === "admin" ||
        auth.role === "safety_manager";

      if (!canComplete) {
        return Errors.forbidden("complete this LMRA session");
      }

      // Parse and validate request
      const body = await req.json();
      const validationResult = CompleteLMRARequestSchema.safeParse(body);

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

      const { overallAssessment, comments, digitalSignature } = validationResult.data;

      // Validate session is ready to complete
      if (!canCompleteLMRA(sessionData)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INCOMPLETE_CHECKS",
              message: "All required checks must be completed before finalizing LMRA",
              details: {
                location: !!sessionData.location,
                environmentalChecks: sessionData.environmentalChecks?.length > 0,
                personnelChecks: sessionData.personnelChecks?.length > 0,
                equipmentChecks: sessionData.equipmentChecks?.length > 0,
              },
            },
          },
          { status: 400 }
        );
      }

      // Calculate duration
      const now = Timestamp.now();
      const startTime =
        sessionData.startedAt instanceof Timestamp
          ? sessionData.startedAt.toDate()
          : new Date(sessionData.startedAt);
      const duration = Math.floor((now.toMillis() - startTime.getTime()) / 1000);

      // Update session with completion
      const updateData: any = {
        overallAssessment,
        comments,
        completedAt: now,
        duration,
        syncStatus: "synced",
        updatedAt: now,
      };

      if (digitalSignature) {
        updateData.digitalSignature = digitalSignature;
      }

      await updateDoc(sessionRef, updateData);

      // Fetch completed session
      const completedDoc = await getDoc(sessionRef);
      const completedSession: LMRASession = {
        id: completedDoc.id,
        ...completedDoc.data(),
      } as LMRASession;

      return NextResponse.json({
        success: true,
        message: "LMRA session completed successfully",
        data: completedSession,
      });
    } catch (error: any) {
      console.error("Error completing LMRA session:", error);

      if (error.name === "ZodError") {
        return Errors.validation(error.errors);
      }

      return Errors.serverError(new Error("Failed to complete LMRA session"));
    }
  }
);
