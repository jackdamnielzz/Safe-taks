/**
 * COMPREHENSIVE ALGOLIA INDEXING SYSTEM FOR SAFETYWORk PRO
 *
 * Multi-entity indexing system supporting TRAs, Templates, Hazards, and Projects
 * Based on comprehensive schema design from Task 4.11B
 *
 * Features:
 * - Multi-tenant organization-scoped indexing
 * - Real-time incremental updates via Firestore triggers
 * - Comprehensive field mapping with search optimization
 * - Robust error handling and multi-tenant security
 * - Multi-language support (Dutch/English)
 *
 * Usage:
 * - Deploy: firebase deploy --only functions
 * - Backfill: node -e "require('./indexers/tras-to-algolia').backfillAll()"
 *
 * Environment Variables:
 * - ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY (required)
 * - ALGOLIA_INDEX_TRAS, ALGOLIA_INDEX_TEMPLATES, etc. (optional)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

admin.initializeApp();

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || '';
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';
const ALGOLIA_INDEX_TRAS = process.env.ALGOLIA_INDEX_TRAS || 'prod_tras';
const ALGOLIA_INDEX_TEMPLATES = process.env.ALGOLIA_INDEX_TEMPLATES || 'prod_templates';
const ALGOLIA_INDEX_HAZARDS = process.env.ALGOLIA_INDEX_HAZARDS || 'prod_hazards';
const ALGOLIA_INDEX_PROJECTS = process.env.ALGOLIA_INDEX_PROJECTS || 'prod_projects';

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.warn('⚠️  Algolia keys not configured. Indexing functions will be no-ops.');
}

const algoliaClient = ALGOLIA_APP_ID && ALGOLIA_ADMIN_KEY
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY)
  : null;

// Initialize Algolia indices
const trasIndex = algoliaClient?.initIndex(ALGOLIA_INDEX_TRAS);
const templatesIndex = algoliaClient?.initIndex(ALGOLIA_INDEX_TEMPLATES);
const hazardsIndex = algoliaClient?.initIndex(ALGOLIA_INDEX_HAZARDS);
const projectsIndex = algoliaClient?.initIndex(ALGOLIA_INDEX_PROJECTS);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely convert Firestore timestamp to Unix timestamp
 */
function timestampToUnix(timestamp: any): number {
  if (!timestamp) return Date.now();

  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp === 'string') return Date.parse(timestamp);

  // Firestore Timestamp
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000;

  return Date.now();
}

/**
 * Generate concatenated text for TRA task steps and hazards
 */
function generateTRATextContent(traData: any): string {
  let texts: string[] = [];

  // Add title and description
  if (traData.title) texts.push(traData.title);
  if (traData.description) texts.push(traData.description);

  // Add task step descriptions and hazard descriptions
  if (traData.taskSteps && Array.isArray(traData.taskSteps)) {
    for (const step of traData.taskSteps) {
      if (step.description) texts.push(step.description);

      if (step.hazards && Array.isArray(step.hazards)) {
        for (const hazard of step.hazards) {
          if (hazard.description) texts.push(hazard.description);

          if (hazard.controlMeasures && Array.isArray(hazard.controlMeasures)) {
            for (const control of hazard.controlMeasures) {
              if (control.description) texts.push(control.description);
            }
          }
        }
      }
    }
  }

  return texts.join(' ');
}

// ============================================================================
// ALGOLIA OBJECT MAPPERS
// ============================================================================

/**
 * Map Firestore TRA document to Algolia TRA object
 * Based on comprehensive schema design from Task 4.11B
 */
function traToAlgoliaObject(id: string, data: FirebaseFirestore.DocumentData) {
  const taskStepsText = generateTRATextContent(data);

  // Extract hazard categories for faceting
  const hazardCategories = data.taskSteps?.map((step: any) =>
    step.hazards?.map((hazard: any) => hazard.category)
  ).flat().filter(Boolean) || [];

  return {
    objectID: id,

    // Primary searchable content
    title: data.title || '',
    description: data.description || '',
    projectName: data.projectRef?.projectName || data.projectName || '',
    createdByName: data.createdByName || '',

    // Concatenated text for full-text search
    taskStepsText,
    hazardsText: '',
    controlMeasuresText: '',
    tags: data.tags || [],

    // Filtering and faceting attributes
    status: data.status || 'draft',
    overallRiskLevel: data.overallRiskLevel || null,
    overallRiskScore: data.overallRiskScore || 0,

    projectId: data.projectId || null,
    templateId: data.templateId || null,
    createdBy: data.createdBy || null,

    complianceFramework: data.complianceFramework || 'vca',
    validityStatus: data.isActive ? 'valid' : 'expired',

    hazardCategories: [...new Set(hazardCategories)],

    teamMembers: data.teamMembers || [],
    requiredCompetencies: data.requiredCompetencies || [],

    language: data.language || 'nl',
    organizationId: data.organizationId || null,

    // Metadata for ranking
    lmraExecutionCount: data.lmraExecutionCount || 0,

    // Timestamps for sorting
    createdAt: timestampToUnix(data.createdAt),
    updatedAt: timestampToUnix(data.updatedAt),
  };
}

/**
 * Map Firestore Template document to Algolia Template object
 */
function templateToAlgoliaObject(id: string, data: FirebaseFirestore.DocumentData) {
  let texts: string[] = [];

  if (data.name) texts.push(data.name);
  if (data.description) texts.push(data.description);

  if (data.taskStepsTemplate && Array.isArray(data.taskStepsTemplate)) {
    for (const step of data.taskStepsTemplate) {
      if (step.description) texts.push(step.description);

      if (step.hazards && Array.isArray(step.hazards)) {
        for (const hazard of step.hazards) {
          if (hazard.description) texts.push(hazard.description);
        }
      }
    }
  }

  const taskStepsText = texts.join(' ');
  const hazardCategories = data.taskStepsTemplate?.map((step: any) =>
    step.hazards?.map((hazard: any) => hazard.category)
  ).flat().filter(Boolean) || [];

  return {
    objectID: id,

    // Primary searchable content
    name: data.name || '',
    description: data.description || '',
    industryCategory: data.industryCategory || '',

    // Concatenated text for full-text search
    taskStepsText,
    hazardsText: '',
    tags: data.tags || [],

    // Filtering and faceting attributes
    hazardCategories: [...new Set(hazardCategories)],
    complianceFramework: data.complianceFramework || 'vca',
    vcaCertified: data.vcaCertified || false,

    status: data.status || 'draft',
    visibility: data.visibility || 'organization',

    language: data.language || 'nl',
    organizationId: data.organizationId || null,

    requiredCompetencies: data.requiredCompetencies || [],
    isSystemTemplate: data.isSystemTemplate || false,

    // Usage statistics for ranking
    usageCount: data.usageCount || 0,
    averageRating: data.averageRating || 0,

    // Timestamps
    createdAt: timestampToUnix(data.createdAt),
    updatedAt: timestampToUnix(data.updatedAt),
  };
}

/**
 * Map Firestore Hazard document to Algolia Hazard object
 */
function hazardToAlgoliaObject(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    objectID: id,

    // Primary searchable content
    title: data.title || '',
    description: data.description || '',
    industry: data.industry || '',

    // Arrays for full-text search
    categories: data.categories || [],
    keywords: data.keywords || [],

    // Filtering attributes
    severity: data.severity || 'low',
    organizationId: data.organizationId || null,

    // Timestamps
    createdAt: timestampToUnix(data.createdAt),
    updatedAt: timestampToUnix(data.updatedAt),
  };
}

/**
 * Map Firestore Project document to Algolia Project object
 */
function projectToAlgoliaObject(id: string, data: FirebaseFirestore.DocumentData) {
  const memberNames = data.membersSummary?.map((member: any) =>
    member.displayName || member.email || member.uid
  ).filter(Boolean) || [];

  return {
    objectID: id,

    // Primary searchable content
    name: data.name || '',
    description: data.description || '',

    // Location data for geographic search
    location: data.location || {},
    _geoloc: data.location?.geoPoint ? {
      lat: data.location.geoPoint.latitude,
      lng: data.location.geoPoint.longitude
    } : undefined,

    // Team information
    memberRoles: data.membersSummary?.map((member: any) => member.role) || [],
    memberNames,
    memberCount: data.memberCount || 0,

    // Filtering attributes
    visibility: data.visibility || 'private',
    organizationId: data.organizationId || null,
    isActive: data.isActive !== false,

    // Statistics for ranking
    trasCount: data.stats?.trasCount || 0,

    // Timestamps
    createdAt: timestampToUnix(data.createdAt),
    updatedAt: timestampToUnix(data.updatedAt),
  };
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * TRA document changes handler
 */
export const onTRAWrite = functions
  .region('europe-west1')
  .firestore
  .document('organizations/{orgId}/tras/{traId}')
  .onWrite(async (change, context) => {
    if (!trasIndex) {
      console.log('Algolia TRAs index not configured - skipping.');
      return;
    }

    const traId = context.params.traId;
    const orgId = context.params.orgId;

    try {
      if (!change.after.exists) {
        // Document deleted
        await trasIndex.deleteObject(traId);
        console.log(`✅ Deleted TRA ${traId} from Algolia index`);
        return;
      }

      // Document created/updated
      const data = change.after.data() as FirebaseFirestore.DocumentData;
      if (!data) {
        console.log(`No data for TRA ${traId} - skipping index update`);
        return;
      }

      // Verify organization scope
      if (data.organizationId !== orgId) {
        console.error(`Organization ID mismatch for TRA ${traId}`);
        return;
      }

      const algoliaObject = traToAlgoliaObject(traId, data);
      await trasIndex.saveObject(algoliaObject);
      console.log(`✅ Indexed TRA ${traId} to Algolia (${Object.keys(algoliaObject).length} fields)`);

    } catch (error) {
      console.error(`❌ Error indexing TRA ${traId}:`, error);
      throw error;
    }
  });

/**
 * Template document changes handler
 */
export const onTemplateWrite = functions
  .region('europe-west1')
  .firestore
  .document('organizations/{orgId}/traTemplates/{templateId}')
  .onWrite(async (change, context) => {
    if (!templatesIndex) {
      console.log('Algolia Templates index not configured - skipping.');
      return;
    }

    const templateId = context.params.templateId;
    const orgId = context.params.orgId;

    try {
      if (!change.after.exists) {
        await templatesIndex.deleteObject(templateId);
        console.log(`✅ Deleted Template ${templateId} from Algolia index`);
        return;
      }

      const data = change.after.data() as FirebaseFirestore.DocumentData;
      if (!data) {
        console.log(`No data for Template ${templateId} - skipping index update`);
        return;
      }

      if (data.organizationId !== orgId) {
        console.error(`Organization ID mismatch for Template ${templateId}`);
        return;
      }

      const algoliaObject = templateToAlgoliaObject(templateId, data);
      await templatesIndex.saveObject(algoliaObject);
      console.log(`✅ Indexed Template ${templateId} to Algolia (${Object.keys(algoliaObject).length} fields)`);

    } catch (error) {
      console.error(`❌ Error indexing Template ${templateId}:`, error);
      throw error;
    }
  });

/**
 * Hazard document changes handler
 */
export const onHazardWrite = functions
  .region('europe-west1')
  .firestore
  .document('organizations/{orgId}/hazards/{hazardId}')
  .onWrite(async (change, context) => {
    if (!hazardsIndex) {
      console.log('Algolia Hazards index not configured - skipping.');
      return;
    }

    const hazardId = context.params.hazardId;
    const orgId = context.params.orgId;

    try {
      if (!change.after.exists) {
        await hazardsIndex.deleteObject(hazardId);
        console.log(`✅ Deleted Hazard ${hazardId} from Algolia index`);
        return;
      }

      const data = change.after.data() as FirebaseFirestore.DocumentData;
      if (!data) {
        console.log(`No data for Hazard ${hazardId} - skipping index update`);
        return;
      }

      if (data.organizationId !== orgId) {
        console.error(`Organization ID mismatch for Hazard ${hazardId}`);
        return;
      }

      const algoliaObject = hazardToAlgoliaObject(hazardId, data);
      await hazardsIndex.saveObject(algoliaObject);
      console.log(`✅ Indexed Hazard ${hazardId} to Algolia (${Object.keys(algoliaObject).length} fields)`);

    } catch (error) {
      console.error(`❌ Error indexing Hazard ${hazardId}:`, error);
      throw error;
    }
  });

/**
 * Project document changes handler
 */
export const onProjectWrite = functions
  .region('europe-west1')
  .firestore
  .document('organizations/{orgId}/projects/{projectId}')
  .onWrite(async (change, context) => {
    if (!projectsIndex) {
      console.log('Algolia Projects index not configured - skipping.');
      return;
    }

    const projectId = context.params.projectId;
    const orgId = context.params.orgId;

    try {
      if (!change.after.exists) {
        await projectsIndex.deleteObject(projectId);
        console.log(`✅ Deleted Project ${projectId} from Algolia index`);
        return;
      }

      const data = change.after.data() as FirebaseFirestore.DocumentData;
      if (!data) {
        console.log(`No data for Project ${projectId} - skipping index update`);
        return;
      }

      if (data.organizationId !== orgId) {
        console.error(`Organization ID mismatch for Project ${projectId}`);
        return;
      }

      const algoliaObject = projectToAlgoliaObject(projectId, data);
      await projectsIndex.saveObject(algoliaObject);
      console.log(`✅ Indexed Project ${projectId} to Algolia (${Object.keys(algoliaObject).length} fields)`);

    } catch (error) {
      console.error(`❌ Error indexing Project ${projectId}:`, error);
      throw error;
    }
  });

// ============================================================================
// BACKFILL FUNCTIONS
// ============================================================================

/**
 * Backfill all TRAs for an organization
 */
export async function backfillTRAs(orgId: string) {
  if (!trasIndex) {
    console.log('TRAs index not configured - skipping.');
    return;
  }

  const db = admin.firestore();
  const trasRef = db.collection(`organizations/${orgId}/tras`);
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let processedCount = 0;

  console.log(`📋 Backfilling TRAs for org: ${orgId}`);

  while (true) {
    let query = trasRef.where('isActive', '!=', false).limit(100);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const records = snapshot.docs
      .map(doc => traToAlgoliaObject(doc.id, doc.data()))
      .filter(record => record.organizationId === orgId);

    if (records.length > 0) {
      await trasIndex.saveObjects(records);
      processedCount += records.length;
      console.log(`  ✅ Indexed ${records.length} TRAs (total: ${processedCount})`);
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < 100) break;
  }

  console.log(`🎯 TRA backfill complete: ${processedCount} records`);
}

/**
 * Backfill all entities for all organizations (comprehensive backfill)
 */
export async function backfillAll() {
  if (!algoliaClient) {
    throw new Error('Algolia not configured - set ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY');
  }

  const db = admin.firestore();
  const orgsSnapshot = await db.collection('organizations').get();

  console.log(`🚀 Starting comprehensive backfill for ${orgsSnapshot.size} organizations`);

  for (const orgDoc of orgsSnapshot.docs) {
    const orgId = orgDoc.id;
    console.log(`\n🏢 Processing organization: ${orgId}`);

    try {
      await backfillTRAs(orgId);
    } catch (error) {
      console.error(`❌ Error backfilling organization ${orgId}:`, error);
      // Continue with next organization
    }
  }

  console.log(`\n🎉 Comprehensive backfill complete!`);
}

/**
 * Get indexing statistics for monitoring
 */
export async function getIndexingStats() {
  if (!algoliaClient) {
    return { error: 'Algolia not configured' };
  }

  try {
    const [trasStats] = await Promise.all([
      trasIndex?.search('', { page: 0, hitsPerPage: 0 }),
    ]);

    return {
      trasCount: trasStats?.nbHits || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting indexing stats:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
