import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Seed TRA templates to Firestore
 * This script uploads all JSON templates from the templates directory to Firestore
 * 
 * Usage:
 * - For system templates: npm run seed:templates
 * - For organization-specific: npm run seed:templates -- --org-id=<orgId>
 */

interface TraTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  vcaCompliant: boolean;
  hazards: Array<{
    name: string;
    description: string;
    typicalEffect?: number;
    typicalExposure?: number;
    typicalProbability?: number;
    controlMeasures?: Array<{
      description: string;
      type: string;
      responsible: string;
      verificationMethod: string;
    }>;
  }>;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    duration: number;
    requiredPersonnel: number;
    location: string;
  }>;
  requiredCompetencies?: string[];
  created_at?: admin.firestore.Timestamp;
  updated_at?: admin.firestore.Timestamp;
  version?: number;
}

async function seedTemplates() {
  try {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    const db = admin.firestore();
    const args = process.argv.slice(2);
    const orgIdArg = args.find((arg) => arg.startsWith('--org-id='));
    const orgId = orgIdArg ? orgIdArg.split('=')[1] : null;

    // Determine the collection path
    const collectionPath = orgId
      ? `organizations/${orgId}/traTemplates`
      : 'traTemplates';

    console.log(`🌱 Seeding templates to: ${collectionPath}`);

    // Get the templates directory
    const templatesDir = path.join(
      __dirname,
      '../../web/src/data/tra-templates'
    );

    if (!fs.existsSync(templatesDir)) {
      console.error(`❌ Templates directory not found: ${templatesDir}`);
      process.exit(1);
    }

    // Read all JSON files from the templates directory
    const files = fs.readdirSync(templatesDir).filter((file) =>
      file.endsWith('.json')
    );

    if (files.length === 0) {
      console.warn('⚠️  No template files found');
      process.exit(0);
    }

    console.log(`📁 Found ${files.length} template file(s)`);

    let successCount = 0;
    let errorCount = 0;

    // Process each template file
    for (const file of files) {
      try {
        const filePath = path.join(templatesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const template: TraTemplate = JSON.parse(fileContent);

        // Validate template structure
        if (!template.id || !template.name) {
          console.warn(`⚠️  Skipping ${file}: Missing required fields (id, name)`);
          errorCount++;
          continue;
        }

        // Add timestamps and metadata
        const now = admin.firestore.Timestamp.now();
        const templateData = {
          ...template,
          created_at: now,
          updated_at: now,
          createdBy: orgId ? 'organization' : 'system',
          organizationId: orgId || null,
          usageCount: 0,
        };

        // Upload to Firestore
        await db.collection(collectionPath).doc(template.id).set(templateData);

        console.log(`✅ Uploaded: ${template.name} (${template.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
        errorCount++;
      }
    }

    console.log(
      `\n📊 Seed completed: ${successCount} successful, ${errorCount} failed`
    );

    if (orgId) {
      console.log(`\n✨ Organization templates seeded for: ${orgId}`);
    } else {
      console.log(`\n✨ System templates seeded successfully`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTemplates();
