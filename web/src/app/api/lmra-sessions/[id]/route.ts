/**
 * LMRA Session Individual Operations
 * GET, PATCH, DELETE operations on specific LMRA sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { UpdateLMRARequestSchema } from "@/lib/validators/lmra";
import { LMRASession } from "@/lib/types/lmra";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";

// ============================================================================
// GET /api/lmra-sessions/[id] - Get LMRA session details
// ============================================================================

export const GET = requireAuth(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: sessionId } = await params;

      // Get session document
      const sessionRef = doc(db, `organizations/${auth.orgId}/lmraSessions`, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return Errors.notFound("LMRA Session");
      }

      const session: LMRASession = {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      } as LMRASession;

      return NextResponse.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error("Error fetching LMRA session:", error);
      return Errors.serverError(new Error("Failed to fetch LMRA session"));
    }
  }
);

// ============================================================================
// PATCH /api/lmra-sessions/[id] - Update LMRA session
// ============================================================================

export const PATCH = requireAuth(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: sessionId } = await params;

      // Get existing session
      const sessionRef = doc(db, `organizations/${auth.orgId}/lmraSessions`, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return Errors.notFound("LMRA Session");
      }

      const sessionData = sessionDoc.data();

      // Check if user can edit (performer or safety manager+)
      const canEdit =
        sessionData.performedBy === auth.userId ||
        auth.role === "admin" ||
        auth.role === "safety_manager";

      if (!canEdit) {
        return Errors.forbidden("edit this LMRA session");
      }

      // Parse and validate update
      const body = await req.json();
      const validationResult = UpdateLMRARequestSchema.safeParse(body);

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

      const updates = validationResult.data;

      // Prepare update object
      const updateData: any = {
        updatedAt: serverTimestamp(),
        syncStatus: "synced",
      };

      // Add each field if present
      if (updates.weatherConditions) updateData.weatherConditions = updates.weatherConditions;
      if (updates.environmentalChecks) updateData.environmentalChecks = updates.environmentalChecks;
      if (updates.personnelChecks) updateData.personnelChecks = updates.personnelChecks;
      if (updates.equipmentChecks) updateData.equipmentChecks = updates.equipmentChecks;
      if (updates.photos) updateData.photos = updates.photos;
      if (updates.overallAssessment) updateData.overallAssessment = updates.overallAssessment;
      if (updates.stopWorkReason) updateData.stopWorkReason = updates.stopWorkReason;
      if (updates.additionalHazards) updateData.additionalHazards = updates.additionalHazards;
      if (updates.comments) updateData.comments = updates.comments;

      // Update session
      await updateDoc(sessionRef, updateData);

      // Fetch updated session
      const updatedDoc = await getDoc(sessionRef);
      const updatedSession: LMRASession = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as LMRASession;

      return NextResponse.json({
        success: true,
        message: "LMRA session updated successfully",
        data: updatedSession,
      });
    } catch (error: any) {
      console.error("Error updating LMRA session:", error);

      if (error.name === "ZodError") {
        return Errors.validation(error.errors);
      }

      return Errors.serverError(new Error("Failed to update LMRA session"));
    }
  }
);

// ============================================================================
// DELETE /api/lmra-sessions/[id] - Delete LMRA session
// ============================================================================

export const DELETE = requireAuth(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: sessionId } = await params;

      // Only safety managers and admins can delete LMRA sessions
      if (auth.role !== "admin" && auth.role !== "safety_manager") {
        return Errors.forbidden("delete LMRA sessions");
      }

      // Get session to verify it exists
      const sessionRef = doc(db, `organizations/${auth.orgId}/lmraSessions`, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return Errors.notFound("LMRA Session");
      }

      // Delete session
      await deleteDoc(sessionRef);

      return NextResponse.json({
        success: true,
        message: "LMRA session deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting LMRA session:", error);
      return Errors.serverError(new Error("Failed to delete LMRA session"));
    }
  }
);
