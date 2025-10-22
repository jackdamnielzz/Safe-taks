# Firebase Schema Reference - SafeWork Pro

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Firestore Database**: (default)

## Overview

SafeWork Pro gebruikt een multi-tenant Firestore database architectuur met strikte organization-scoped data isolatie. Dit document beschrijft alle Firestore collections, document structures, security rules, en best practices.

## Database Architecture

### Multi-Tenant Isolation

Alle data is gescoped per organization via het `organizationId` field:

```typescript
// Firestore document pattern
{
  organizationId: string;  // REQUIRED in all collections
  // ... other fields
}
```

**Security Rules Pattern**:
```javascript
// All reads/writes require organization membership
match /collection/{docId} {
  allow read: if isOrganizationMember(resource.data.organizationId);
  allow write: if isOrganizationMember(request.resource.data.organizationId);
}
```

## Core Collections

### 1. organizations

**Path**: `/organizations/{organizationId}`

**Purpose**: Stores organization/company information and settings

**Document Structure**:
```typescript
interface Organization {
  // Identity
  id: string;                    // Auto-generated document ID
  name: string;                  // Company name
  slug: string;                  // URL-friendly slug
  
  // Contact Information
  email: string;
  phone?: string;
  website?: string;
  
  // Address
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  
  // Subscription
  subscription: {
    tier: 'starter' | 'professional' | 'enterprise';
    status: 'trial' | 'active' | 'past_due' | 'cancelled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Timestamp;
    trialEndsAt?: Timestamp;
  };
  
  // Usage Tracking
  usage: {
    userCount: number;
    projectCount: number;
    traCount: number;
    storageBytes: number;
  };
  
  // Settings
  settings: {
    locale: 'nl' | 'en';
    timezone: string;
    dateFormat: string;
    branding?: {
      primaryColor: string;
      logo?: string;
    };
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;           // User ID
  isActive: boolean;
}
```

**Indexes**:
- `slug` (ascending)
- `createdAt` (descending)

**Security Rules**:
- Read: Organization members only
- Create: Authenticated users (creates first user as admin)
- Update: Admin role only
- Delete: Admin role only (soft delete)

---

### 2. users

**Path**: `/users/{userId}`

**Purpose**: User profiles and metadata (extends Firebase Auth)

**Document Structure**:
```typescript
interface User {
  // Identity
  id: string;                    // Matches Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  
  // Organization Membership
  organizationId: string;        // Primary organization
  roles: ('admin' | 'safety_manager' | 'supervisor' | 'field_worker')[];
  
  // Permissions (custom claims synced from Firebase Auth)
  permissions: {
    createTRA: boolean;
    executeLMRA: boolean;
    approveTRA: boolean;
    manageUsers: boolean;
    viewReports: boolean;
    manageSettings: boolean;
  };
  
  // Activity Tracking
  lastLogin?: Timestamp;
  activationStatus: 'pending' | 'active' | 'inactive';
  activationMilestones: {
    firstLogin: boolean;
    firstTRA: boolean;
    firstLMRA: boolean;
  };
  
  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    locale: 'nl' | 'en';
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `roles` (composite)
- `email` (ascending)
- `createdAt` (descending)

**Security Rules**:
- Read: Organization members can read other members
- Update: Users can update own profile; admins can update organization members
- Delete: Admin only (soft delete)

---

### 3. projects

**Path**: `/projects/{projectId}`

**Purpose**: Project management for organizing TRAs and work activities

**Document Structure**:
```typescript
interface Project {
  // Identity
  id: string;
  name: string;
  description?: string;
  
  // Organization
  organizationId: string;
  
  // Location
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Timeline
  startDate?: Timestamp;
  endDate?: Timestamp;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  
  // Team
  members: Array<{
    userId: string;
    role: 'owner' | 'manager' | 'contributor' | 'reader';
    addedAt: Timestamp;
  }>;
  
  // Statistics
  traCount: number;
  lmraCount: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `status` (composite)
- `organizationId` + `createdAt` (composite)

**Security Rules**:
- Read: Organization members
- Create: safety_manager, admin roles
- Update: Project members with manager/owner role
- Delete: Project owner or admin only

---

### 4. tras

**Path**: `/tras/{traId}`

**Purpose**: Task Risk Analysis documents

**Document Structure**:
```typescript
interface TRA {
  // Identity
  id: string;
  title: string;
  description?: string;
  
  // Organization & Project
  organizationId: string;
  projectId?: string;
  projectName?: string;         // Denormalized
  
  // Task Information
  taskSteps: Array<{
    id: string;
    order: number;
    description: string;
    duration?: number;           // Minutes
    requiredPersonnel?: number;
    equipment?: string[];
    materials?: string[];
    hazards: Array<{
      hazardId: string;
      hazardName: string;        // Denormalized
      category: string;
      riskAssessment: {
        probability: number;     // Kinney & Wiruth: 0.1-10
        exposure: number;        // Kinney & Wiruth: 0.5-10
        consequence: number;     // Kinney & Wiruth: 1-100
        riskScore: number;       // P × E × C
        riskLevel: 'trivial' | 'acceptable' | 'substantial' | 'intolerable';
      };
      controlMeasures: Array<{
        controlId: string;
        description: string;
        hierarchy: 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe';
        effectiveness: number;   // 0-100
        residualRisk: {
          probability: number;
          exposure: number;
          consequence: number;
          riskScore: number;
          riskLevel: string;
        };
      }>;
    }>;
  }>;
  
  // Overall Risk
  overallRisk: {
    initialScore: number;
    residualScore: number;
    level: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Team & Personnel
  team: Array<{
    userId: string;
    displayName: string;         // Denormalized
    role: string;
    competencies?: string[];
  }>;
  
  // Approval Workflow
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'expired';
  approvals: Array<{
    userId: string;
    displayName: string;
    role: string;
    decision: 'approved' | 'rejected';
    signature?: string;          // Base64 image
    comments?: string;
    timestamp: Timestamp;
  }>;
  
  // Compliance
  compliance: {
    vca: boolean;
    iso45001: boolean;
    complianceScore?: number;    // 0-100
  };
  
  // Validity
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  approvedAt?: Timestamp;
  approvedBy?: string;
  version: number;
  isActive: boolean;
}
```

**Indexes** (11 critical):
1. `organizationId` + `status` + `createdAt`
2. `organizationId` + `projectId` + `status`
3. `organizationId` + `createdBy` + `createdAt`
4. `organizationId` + `overallRisk.level` + `status`
5. `organizationId` + `validUntil`
6. `organizationId` + `createdAt` (descending)
7. `status` + `createdAt`
8. `projectId` + `status`
9. `createdBy` + `createdAt`
10. `approvedAt`
11. `validUntil`

**Security Rules**:
- Read: Organization members
- Create: Users with createTRA permission
- Update: Creator or safety_manager/admin
- Delete: Admin only (soft delete)

---

### 5. templates

**Path**: `/templates/{templateId}`

**Purpose**: Reusable TRA templates for common tasks

**Document Structure**:
```typescript
interface Template {
  // Identity
  id: string;
  name: string;
  description?: string;
  category: string;
  industry: string[];
  
  // Organization (null for system templates)
  organizationId: string | null;
  isSystem: boolean;
  
  // Template Content (same structure as TRA taskSteps)
  taskSteps: Array<{
    // Same as TRA.taskSteps
  }>;
  
  // Metadata
  version: string;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `category`
- `industry` (array-contains)
- `usageCount` (descending)

**Security Rules**:
- Read: Organization members (own + system templates)
- Create: safety_manager, admin
- Update: Creator or admin
- Delete: Admin only

---

### 6. lmra-sessions

**Path**: `/lmra-sessions/{sessionId}`

**Purpose**: Last Minute Risk Analysis execution records

**Document Structure**:
```typescript
interface LMRASession {
  // Identity
  id: string;
  
  // Organization & Project
  organizationId: string;
  projectId?: string;
  projectName?: string;
  
  // TRA Reference
  traId: string;
  traTitle: string;              // Denormalized
  
  // Execution Details
  assessment: 'safe' | 'caution' | 'stop_work';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Environmental Conditions
  weather?: {
    temperature: number;
    condition: string;
    windSpeed: number;
    visibility: string;
    isSafe: boolean;
  };
  
  // Location Verification
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Timestamp;
    address?: string;
    verificationScore: number;   // 0-100
  };
  
  // Personnel Check
  personnel: Array<{
    userId: string;
    displayName: string;
    competencyVerified: boolean;
    certificationsValid: boolean;
  }>;
  
  // Equipment Check
  equipment: Array<{
    id: string;
    name: string;
    inspectionStatus: 'valid' | 'expired' | 'required';
    lastInspectionDate?: Timestamp;
  }>;
  
  // Hazard Verification
  hazardsConfirmed: boolean;
  additionalHazards?: string[];
  
  // Documentation
  photos: Array<{
    url: string;
    caption?: string;
    timestamp: Timestamp;
  }>;
  notes?: string;
  
  // Completion
  completedAt?: Timestamp;
  duration?: number;             // Minutes
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `assessment` + `createdAt`
- `organizationId` + `projectId` + `createdAt`
- `traId` + `createdAt`
- `assessment` + `createdAt`

**Security Rules**:
- Read: Organization members
- Create: Users with executeLMRA permission
- Update: Creator only (within 24h), then read-only
- Delete: Admin only

---

### 7. hazards

**Path**: `/hazards/{hazardId}`

**Purpose**: Hazard library (system + custom per organization)

**Document Structure**:
```typescript
interface Hazard {
  // Identity
  id: string;
  name: string;
  description: string;
  category: 'physical' | 'chemical' | 'biological' | 'ergonomic' | 'psychosocial';
  
  // Organization (null for system hazards)
  organizationId: string | null;
  isCustom: boolean;
  
  // Risk Information
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  industry: string[];
  
  // Related Information
  relatedRegulations?: string[];
  controlSuggestions?: string[];
  
  // Metadata
  createdAt: Timestamp;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `category`
- `industry` (array-contains)
- `category` + `riskLevel`

**Security Rules**:
- Read: Organization members (own + system hazards)
- Create: safety_manager, admin
- Update: Creator or admin
- Delete: Admin only

---

### 8. controls

**Path**: `/controls/{controlId}`

**Purpose**: Control measure library

**Document Structure**:
```typescript
interface Control {
  // Identity
  id: string;
  name: string;
  description: string;
  
  // Hierarchy of Controls
  hierarchy: 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe';
  
  // Organization
  organizationId: string | null;
  isCustom: boolean;
  
  // Effectiveness
  effectiveness: number;         // 0-100
  applicableHazards: string[];   // Hazard categories
  
  // Implementation
  implementationCost: 'low' | 'medium' | 'high';
  implementationTime: string;
  
  // Metadata
  createdAt: Timestamp;
  isActive: boolean;
}
```

**Security Rules**: Same as hazards

---

### 9. invitations

**Path**: `/invitations/{invitationId}`

**Purpose**: Team member invitations

**Document Structure**:
```typescript
interface Invitation {
  // Identity
  id: string;
  token: string;                 // Secure random token
  
  // Recipient
  email: string;
  displayName: string;
  role: 'admin' | 'safety_manager' | 'supervisor' | 'field_worker';
  phoneNumber?: string;
  
  // Organization
  organizationId: string;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  
  // Expiration
  expiresAt: Timestamp;          // 7 days from creation
  
  // Acceptance
  acceptedAt?: Timestamp;
  acceptedBy?: string;           // User ID after acceptance
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}
```

**Indexes**:
- `organizationId` + `status`
- `email` + `status`
- `expiresAt`

**Security Rules**:
- Read by token: Public (for acceptance page)
- Read by organization: Organization members
- Create: admin, safety_manager
- Update: System only (for acceptance/decline)
- Delete: Creator or admin (cancellation)

---

### 10. uploads

**Path**: `/organizations/{organizationId}/uploads/{uploadId}`

**Purpose**: File upload metadata tracking

**Document Structure**:
```typescript
interface Upload {
  // Identity
  id: string;
  filename: string;
  originalFilename: string;
  
  // Organization
  organizationId: string;
  
  // Storage
  storagePath: string;
  downloadURL: string;
  thumbnailURL?: string;
  
  // File Properties
  contentType: string;
  sizeBytes: number;
  
  // Context
  linkedTo?: {
    type: 'tra' | 'lmra' | 'project' | 'organization';
    id: string;
  };
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}
```

**Security Rules**:
- Read: Organization members
- Create: Authenticated organization members
- Delete: Creator or admin

---

### 11. audit-logs

**Path**: `/audit-logs/{logId}`

**Purpose**: Immutable audit trail for compliance

**Document Structure**:
```typescript
interface AuditLog {
  // Identity
  id: string;
  
  // Event
  timestamp: Timestamp;
  action: string;                // e.g., 'tra_created', 'user_deleted'
  category: 'tra' | 'lmra' | 'user' | 'organization' | 'security' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Actor
  actor: string;                 // User ID or 'system'
  actorEmail?: string;
  actorRole?: string;
  
  // Subject
  subject: string;               // ID of affected entity
  subjectType: string;           // e.g., 'tra', 'user'
  
  // Organization
  organizationId?: string;
  
  // Details
  metadata?: Record<string, any>;
  changes?: {
    before?: any;
    after?: any;
  };
  
  // Compliance
  isComplianceRelevant: boolean;
  retentionUntil: Timestamp;     // 7 years for compliance
}
```

**Indexes**:
- `organizationId` + `timestamp` (descending)
- `category` + `timestamp`
- `actor` + `timestamp`
- `isComplianceRelevant` + `timestamp`

**Security Rules**:
- Read: Admin only
- Create: System only (immutable)
- Update: DENIED (immutable)
- Delete: DENIED (immutable)

---

### 12. webhooks

**Path**: `/webhooks/{webhookId}`

**Purpose**: Webhook configurations for external integrations

**Document Structure**:
```typescript
interface Webhook {
  // Identity
  id: string;
  name: string;
  description?: string;
  
  // Organization
  organizationId: string;
  
  // Configuration
  url: string;
  secret: string;                // HMAC signature secret
  events: string[];              // Event types to subscribe to
  
  // Status
  isActive: boolean;
  
  // Delivery Stats
  lastDeliveryAt?: Timestamp;
  successCount: number;
  failureCount: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Security Rules**:
- Read: Organization admin/safety_manager
- Create: Admin only
- Update: Admin only
- Delete: Admin only

---

### 13. backup-metadata

**Path**: `/backup-metadata/{backupName}`

**Purpose**: Backup tracking and metadata

**Document Structure**:
```typescript
interface BackupMetadata {
  // Identity
  id: string;                    // Backup name
  
  // Backup Info
  timestamp: Timestamp;
  type: 'scheduled' | 'manual';
  triggeredBy: string;           // User ID or 'system'
  
  // Status
  status: 'in_progress' | 'completed' | 'failed';
  
  // Content
  collections: string[];
  backupPath: string;            // GCS path
  
  // Timing
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;             // Milliseconds
  
  // Size
  documentCount?: number;
  sizeBytes?: number;
  
  // Error Info
  error?: string;
  failedAt?: Timestamp;
}
```

**Security Rules**:
- Read: Admin only
- Create/Update: Cloud Functions only
- Delete: DENIED (retain for audit)

---

## Subcollections

### comments (under /tras/{traId}/comments)

**Purpose**: TRA review comments and discussions

```typescript
interface Comment {
  id: string;
  traId: string;
  content: string;
  author: {
    userId: string;
    displayName: string;
  };
  section?: string;              // Which TRA section
  isResolved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

---

## Security Rules Summary

### Global Rules

```javascript
// Helper functions
function isAuthenticated() {
  return request.auth != null;
}

function isOrganizationMember(orgId) {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
}

function hasRole(role) {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
}

function isAdmin() {
  return hasRole('admin');
}

function isSafetyManager() {
  return hasRole('safety_manager');
}
```

### Collection-Specific Rules

**Pattern**: All collections follow multi-tenant isolation:

```javascript
match /collection/{docId} {
  // Read: Organization members only
  allow read: if isOrganizationMember(resource.data.organizationId);
  
  // Create: Role-based + organization scoped
  allow create: if isAuthenticated() &&
                   isOrganizationMember(request.resource.data.organizationId) &&
                   hasRequiredRole();
  
  // Update: Role-based + ownership checks
  allow update: if isOrganizationMember(resource.data.organizationId) &&
                   (isOwner() || hasManagementRole());
  
  // Delete: Admin only
  allow delete: if isAdmin() &&
                   isOrganizationMember(resource.data.organizationId);
}
```

---

## Best Practices

### 1. Data Normalization vs Denormalization

**Denormalize for Performance**:
- Store `projectName` in TRAs (avoid joins)
- Store `displayName` in comments (avoid user lookups)
- Store `traTitle` in LMRA sessions (quick display)

**Normalize for Consistency**:
- Reference IDs for relationships
- Use Firestore listeners to sync denormalized data
- Implement update triggers for consistency

### 2. Querying Best Practices

**Use Composite Indexes**:
```typescript
// Good: Uses composite index
const query = db.collection('tras')
  .where('organizationId', '==', orgId)
  .where('status', '==', 'approved')
  .orderBy('createdAt', 'desc');
```

**Limit Field Selection**:
```typescript
// Reduce data transfer
const query = db.collection('tras')
  .where('organizationId', '==', orgId)
  .select('title', 'status', 'createdAt');
```

**Use Cursor Pagination**:
```typescript
// Better than offset-based
const query = db.collection('tras')
  .where('organizationId', '==', orgId)
  .orderBy('createdAt', 'desc')
  .startAfter(lastDocument)
  .limit(20);
```

### 3. Write Operations

**Use Batch Writes** for related updates:
```typescript
const batch = db.batch();

// Update TRA
batch.update(traRef, { status: 'approved' });

// Create audit log
batch.set(auditLogRef, { action: 'tra_approved', ... });

// Update organization stats
batch.update(orgRef, { 'usage.traCount': FieldValue.increment(1) });

await batch.commit();
```

**Use Transactions** for critical operations:
```typescript
await db.runTransaction(async (transaction) => {
  const orgDoc = await transaction.get(orgRef);
  const currentCount = orgDoc.data().usage.userCount;
  
  if (currentCount >= limit) {
    throw new Error('User limit reached');
  }
  
  transaction.update(orgRef, {
    'usage.userCount': FieldValue.increment(1)
  });
});
```

### 4. Data Validation

**Always Validate on Server**:
```typescript
// API route validation with Zod
import { traSchema } from '@/lib/validators/tra';

const result = traSchema.safeParse(data);
if (!result.success) {
  return NextResponse.json({ errors: result.error }, { status: 400 });
}
```

**Client-Side for UX Only**:
```typescript
// Form validation with react-hook-form + Zod
const form = useForm({
  resolver: zodResolver(traSchema)
});
```

### 5. Soft Deletes

**Never Hard Delete**:
```typescript
// Good: Soft delete with flag
await traRef.update({
  isActive: false,
  deletedAt: Timestamp.now(),
  deletedBy: userId
});

// Filter in queries
const query = db.collection('tras')
  .where('isActive', '==', true);
```

### 6. Timestamp Usage

**Always Use Server Timestamp**:
```typescript
// Good: Server timestamp (consistent)
await doc.set({
  ...data,
  createdAt: FieldValue.serverTimestamp()
});

// Bad: Client timestamp (can be wrong)
await doc.set({
  ...data,
  createdAt: new Date()  // ❌ Don't do this
});
```

---

## Migration & Maintenance

### Schema Changes

**Adding New Fields**:
1. Update TypeScript types first
2. Update Zod validators
3. Add field to new documents
4. Backfill existing documents if needed
5. Update security rules if needed
6. Deploy Firestore rules
7. Deploy application code

**Backfill Script Pattern**:
```typescript
// Example: Add projectName to existing TRAs
const batch = db.batch();
const snapshot = await db.collection('tras')
  .where('projectName', '==', null)
  .limit(500)
  .get();

for (const doc of snapshot.docs) {
  const projectDoc = await db.collection('projects')
    .doc(doc.data().projectId)
    .get();
  
  batch.update(doc.ref, {
    projectName: projectDoc.data().name
  });
}

await batch.commit();
```

### Index Management

**Deploy Indexes**:
```bash
firebase deploy --only firestore:indexes
```

**Monitor Index Usage**:
- Check Firestore console for index recommendations
- Review slow queries in Firebase Performance
- Add composite indexes as needed

---

## Troubleshooting

### Common Issues

**Permission Denied**:
- Check user's custom claims (`roles` array)
- Verify `organizationId` in request matches user's organization
- Check Firestore security rules deployment

**Missing Data**:
- Check `isActive` flag (soft deletes)
- Verify composite index exists for query
- Check organization isolation

**Slow Queries**:
- Add composite index
- Reduce document size (field selection)
- Implement caching (see FIREBASE_OPTIMIZATION_GUIDE.md)

---

## Appendix

### Complete Index List

Required Firestore indexes (deploy with `firebase deploy --only firestore:indexes`):

```json
{
  "indexes": [
    {
      "collectionGroup": "tras",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    // ... (see firestore.indexes.json for complete list)
  ]
}
```

### Data Retention Policy

- **Active Data**: Indefinite (until soft deleted)
- **Soft Deleted**: 90 days, then hard delete
- **Audit Logs**: 7 years (compliance requirement)
- **Backups**: 30 days (automated cleanup)

---

**For detailed implementation examples, see**:
- FIRESTORE_DATA_MODEL.md - Original data model design
- firestore.rules - Complete security rules
- firestore.indexes.json - All required indexes
