/**
 * Template Seeding Functions
 *
 * Initialize system templates for organizations
 * Can be called during organization creation or manually by admins
 */

import { VCA_TEMPLATES } from "./vca-templates";
import { initializeAdmin } from "@/lib/server-helpers";
import type { TRATemplate } from "../types/template";

/**
 * Seed system templates for an organization
 *
 * @param organizationId - Organization ID to seed templates for
 * @param createdBy - User ID who is creating the templates
 * @param createdByName - Display name of creator
 * @returns Array of created template IDs
 */
export async function seedSystemTemplates(
  organizationId: string,
  createdBy: string,
  createdByName: string = "System"
): Promise<string[]> {
  const { firestore } = initializeAdmin();
  const templateIds: string[] = [];
  const now = new Date();

  const templatesRef = firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates");

  // Check if templates already exist
  const existing = await templatesRef.where("isSystemTemplate", "==", true).limit(1).get();

  if (!existing.empty) {
    console.log(`System templates already exist for organization ${organizationId}`);
    return existing.docs.map((doc: any) => doc.id);
  }

  // Create each template
  for (const templateData of VCA_TEMPLATES) {
    const template: Omit<TRATemplate, "id"> = {
      ...templateData,
      organizationId,
      createdBy,
      createdByName,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await templatesRef.add(template);
    templateIds.push(docRef.id);

    console.log(`Created template: ${template.name} (${docRef.id})`);
  }

  console.log(`Seeded ${templateIds.length} system templates for organization ${organizationId}`);

  return templateIds;
}

/**
 * Get template by industry category
 *
 * @param organizationId - Organization ID
 * @param industryCategory - Industry category to filter by
 * @returns Matching templates
 */
export async function getTemplatesByIndustry(
  organizationId: string,
  industryCategory: string
): Promise<TRATemplate[]> {
  const { firestore } = initializeAdmin();

  const snapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates")
    .where("industryCategory", "==", industryCategory)
    .where("isActive", "==", true)
    .where("status", "==", "published")
    .get();

  const templates: TRATemplate[] = [];
  snapshot.forEach((doc: any) => {
    templates.push({
      id: doc.id,
      ...doc.data(),
    } as TRATemplate);
  });

  return templates;
}

/**
 * Get all published templates for an organization
 *
 * @param organizationId - Organization ID
 * @returns All published templates
 */
export async function getAllPublishedTemplates(organizationId: string): Promise<TRATemplate[]> {
  const { firestore } = initializeAdmin();

  const snapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates")
    .where("isActive", "==", true)
    .where("status", "==", "published")
    .orderBy("usageCount", "desc")
    .get();

  const templates: TRATemplate[] = [];
  snapshot.forEach((doc: any) => {
    templates.push({
      id: doc.id,
      ...doc.data(),
    } as TRATemplate);
  });

  return templates;
}

/**
 * Increment template usage count
 * Called when a TRA is created from a template
 *
 * @param organizationId - Organization ID
 * @param templateId - Template ID
 */
export async function incrementTemplateUsage(
  organizationId: string,
  templateId: string
): Promise<void> {
  const { firestore, admin } = initializeAdmin();

  const templateRef = firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates")
    .doc(templateId);

  await templateRef.update({
    usageCount: admin.firestore.FieldValue.increment(1),
    lastUsedAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Delete/archive old templates (cleanup function)
 * Can be run periodically to clean up unused templates
 *
 * @param organizationId - Organization ID
 * @param daysUnused - Days since last use threshold (default 365)
 * @returns Number of templates archived
 */
export async function archiveUnusedTemplates(
  organizationId: string,
  daysUnused: number = 365
): Promise<number> {
  const { firestore } = initializeAdmin();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysUnused);

  const snapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates")
    .where("isSystemTemplate", "==", false) // Don't archive system templates
    .where("isActive", "==", true)
    .where("usageCount", "==", 0)
    .get();

  let archivedCount = 0;
  const batch = firestore.batch();
  const now = new Date();

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate() || new Date(0);

    if (createdAt < threshold) {
      batch.update(doc.ref, {
        isActive: false,
        archivedAt: now,
        status: "archived",
        updatedAt: now,
      });
      archivedCount++;
    }
  });

  if (archivedCount > 0) {
    await batch.commit();
    console.log(`Archived ${archivedCount} unused templates for organization ${organizationId}`);
  }

  return archivedCount;
}

/**
 * Get template statistics for an organization
 *
 * @param organizationId - Organization ID
 * @returns Statistics about templates
 */
export async function getTemplateStatistics(organizationId: string) {
  const { firestore } = initializeAdmin();

  const snapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .collection("traTemplates")
    .where("isActive", "==", true)
    .get();

  const stats = {
    total: 0,
    byStatus: { draft: 0, published: 0, archived: 0 },
    byIndustry: {} as Record<string, number>,
    vcaCertified: 0,
    systemTemplates: 0,
    organizationTemplates: 0,
    totalUsage: 0,
  };

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    stats.total++;

    stats.byStatus[data.status as keyof typeof stats.byStatus]++;

    const industry = data.industryCategory;
    stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;

    if (data.vcaCertified) stats.vcaCertified++;
    if (data.isSystemTemplate) stats.systemTemplates++;
    else stats.organizationTemplates++;

    stats.totalUsage += data.usageCount || 0;
  });

  return stats;
}
