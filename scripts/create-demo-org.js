/**
 * Script to create a demo organization for development
 * Run with: node scripts/create-demo-org.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Try to load service account from file
  try {
    const serviceAccount = require('../web/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with serviceAccountKey.json');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('\nMake sure web/serviceAccountKey.json exists with valid credentials.');
    process.exit(1);
  }
}

const db = admin.firestore();

async function createDemoOrg() {
  const orgId = 'demo-org';
  const orgRef = db.collection('organizations').doc(orgId);

  try {
    // Check if organization already exists
    const orgSnap = await orgRef.get();
    
    if (orgSnap.exists) {
      console.log(`✅ Organization '${orgId}' already exists`);
      const data = orgSnap.data();
      console.log('Current data:', JSON.stringify(data, null, 2));
      return;
    }

    // Create organization document
    const orgData = {
      name: 'Demo Organization',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      subscription: {
        tier: 'professional',
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp()
      },
      usage: {
        projectCount: 0,
        traCount: 0,
        userCount: 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      },
      limits: {
        maxProjects: 100,
        maxTRAs: 1000,
        maxUsers: 50
      },
      settings: {
        language: 'nl',
        timezone: 'Europe/Amsterdam'
      }
    };

    await orgRef.set(orgData);
    console.log(`✅ Successfully created organization '${orgId}'`);
    console.log('Organization data:', JSON.stringify(orgData, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating organization:', error);
    throw error;
  }
}

// Run the script
createDemoOrg()
  .then(() => {
    console.log('\n✅ Demo organization setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create demo organization:', error);
    process.exit(1);
  });