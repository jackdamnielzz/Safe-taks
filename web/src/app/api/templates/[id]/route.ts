/**
 * Template Detail API Routes
 * GET /api/templates/[id] - Get template by ID
 * PATCH /api/templates/[id] - Update template
 * DELETE /api/templates/[id] - Delete template (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { Errors } from "@/lib/api/errors";
import {
  UpdateTemplateRequestSchema,
  validateSequentialSteps,
  validateVCACompliance,
  validateTemplateForPublication,
  sanitizeTemplateData,
} from "@/lib/validators/template";
import type { TRATemplate } from "@/lib/types/template";

/**
 * GET /api/templates/[id]
 * Get template by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();

    const templateDoc = await firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("traTemplates")
      .doc(id)
      .get();

    if (!templateDoc.exists) {
      return Errors.notFound("Template");
    }

    const template: TRATemplate = {
      id: templateDoc.id,
      ...templateDoc.data(),
    } as TRATemplate;

    // Check if template is active
    if (!template.isActive) {
      return Errors.notFound("Template");
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error getting template:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}

/**
 * PATCH /api/templates/[id]
 * Update template
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();

    // Get existing template
    const templateRef = firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("traTemplates")
      .doc(id);

    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return Errors.notFound("Template");
    }

    const existingTemplate = templateDoc.data() as TRATemplate;

    // Check if template is active
    if (!existingTemplate.isActive) {
      return Errors.notFound("Template");
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = UpdateTemplateRequestSchema.safeParse(body);

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

    const updates = sanitizeTemplateData(parseResult.data);

    // Additional validations if task steps are being updated
    if (updates.taskStepsTemplate) {
      const stepValidation = validateSequentialSteps(updates.taskStepsTemplate);
      if (!stepValidation.valid) {
        return Errors.validation({ steps: stepValidation.error! });
      }
    }

    // VCA validation if relevant fields are being updated
    if (updates.vcaCertified !== undefined || updates.vcaVersion !== undefined) {
      const vcaValidation = validateVCACompliance({
        vcaCertified: updates.vcaCertified ?? existingTemplate.vcaCertified,
        vcaVersion: updates.vcaVersion ?? existingTemplate.vcaVersion,
        complianceFramework: existingTemplate.complianceFramework,
      });
      if (!vcaValidation.valid) {
        return Errors.validation({ vca: vcaValidation.error! });
      }
    }

    // Check if publishing
    const isPublishing = updates.status === "published" && existingTemplate.status === "draft";

    if (isPublishing) {
      const publicationValidation = validateTemplateForPublication({
        name: updates.name ?? existingTemplate.name,
        description: updates.description ?? existingTemplate.description,
        taskStepsTemplate: updates.taskStepsTemplate ?? existingTemplate.taskStepsTemplate,
        status: existingTemplate.status,
      });

      if (!publicationValidation.valid) {
        return Errors.validation({ publication: publicationValidation.error! });
      }
    }

    // Get user info for version history
    const userDoc = await firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("users")
      .doc(user.uid)
      .get();

    const userData = userDoc.data();
    const changedByName = userData
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
      : "Unknown";

    // Prepare update data
    const now = new Date();
    const newVersion = existingTemplate.version + 1;

    const updateData: any = {
      ...updates,
      updatedAt: now,
      updatedBy: user.uid,
      version: newVersion,
    };

    // Add version history entry
    const versionEntry = {
      version: newVersion,
      versionDate: now,
      versionNotes: updates.versionNotes || "Wijzigingen",
      changedBy: user.uid,
      changedByName,
    };

    updateData.versionHistory = [...(existingTemplate.versionHistory || []), versionEntry];

    // Add published timestamp if publishing
    if (isPublishing) {
      updateData.publishedAt = now;
    }

    // Remove versionNotes from the update data (it's only for history)
    delete updateData.versionNotes;

    // Update template
    await templateRef.update(updateData);

    // Get updated template
    const updatedDoc = await templateRef.get();
    const updatedTemplate: TRATemplate = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as TRATemplate;

    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    console.error("Error updating template:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete template (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();

    // Get existing template
    const templateRef = firestore
      .collection("organizations")
      .doc(user.orgId)
      .collection("traTemplates")
      .doc(id);

    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return Errors.notFound("Template");
    }

    const existingTemplate = templateDoc.data() as TRATemplate;

    // Check if template is active
    if (!existingTemplate.isActive) {
      return Errors.notFound("Template");
    }

    // Check if template is a system template
    if (existingTemplate.isSystemTemplate) {
      return Errors.forbidden("Systeem templates kunnen niet worden verwijderd");
    }

    // Check if template is in use
    if (existingTemplate.usageCount > 0) {
      return Errors.conflict("Template kan niet worden verwijderd omdat deze in gebruik is");
    }

    // Soft delete
    const now = new Date();
    await templateRef.update({
      isActive: false,
      archivedAt: now,
      archivedBy: user.uid,
      updatedAt: now,
    });

    return NextResponse.json({ message: "Template succesvol verwijderd" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}
