# System Patterns - Architectuur & Patronen

**Laatst Bijgewerkt**: 21 oktober 2025, 21:16 (Europe/Amsterdam)

## 🏗️ Architectuur Overzicht

### High-Level Architectuur
```
┌─────────────────────────────────────────┐
│         Next.js 15 Frontend             │
│    (React 19, TypeScript, Tailwind)     │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │   Vercel    │ (Hosting, CDN, Edge Functions)
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼────┐ ┌──▼───┐ ┌────▼────┐
│Firebase│ │Stripe│ │OpenWeather│
│Backend │ │Payments│ │  API    │
└────────┘ └──────┘ └─────────┘
    │
    ├── Firestore (Database)
    ├── Auth (Authentication)
    ├── Storage (Files)
    └── Functions (Serverless)
```

## 🔐 Multi-Tenant Architectuur

### Organization-Scoped Data Isolation

**Principe**: Elke organization heeft complete data isolatie via Firestore security rules

```javascript
// Firestore Collection Structure
organizations/{orgId}/
  ├── users/{userId}
  ├── projects/{projectId}
  ├── tras/{traId}
  │   └── taskSteps/[array]
  │       └── hazards/[array]
  │           └── controlMeasures/[array]
  ├── lmraSessions/{sessionId}
  ├── templates/{templateId}
  ├── invitations/{invitationId}
  └── uploads/{uploadId}
```

**Security Rules Pattern**:
```javascript
// Basis patroon voor alle collections
match /organizations/{orgId}/{collection}/{docId} {
  allow read, write: if request.auth != null 
    && request.auth.token.orgId == orgId
    && hasRole(['admin', 'safety_manager', ...]);
}
```

**Voordelen**:
- Complete data isolatie tussen organizations
- Eenvoudige GDPR compliance (delete per organization)
- Schaalbaar naar 1000+ organizations
- Voorkomt cross-tenant data leaks

## 🎭 Role-Based Access Control (RBAC)

### 4-Tier Role Systeem

**Firebase Custom Claims**:
```typescript
interface CustomClaims {
  orgId: string;           // Organization isolatie
  role: UserRole;          // Primary role
  roles?: UserRole[];      // Multiple roles (optional)
}

type UserRole = 
  | 'admin'              // Volledige toegang, org management
  | 'safety_manager'     // TRA/LMRA management, rapportage
  | 'supervisor'         // TRA goedkeuring, team oversight
  | 'field_worker';      // LMRA uitvoering, read-only TRAs
```

**Permission Matrix**:
| Feature | Admin | Safety Mgr | Supervisor | Field Worker |
|---------|-------|------------|------------|--------------|
| Org Management | ✅ | ❌ | ❌ | ❌ |
| Create TRA | ✅ | ✅ | ✅ | ❌ |
| Approve TRA | ✅ | ✅ | ✅ | ❌ |
| Execute LMRA | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |

**Implementatie Pattern**:
```typescript
// API Route Protection
export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  
  if (!auth || !hasRole(auth, ['admin', 'safety_manager'])) {
    return unauthorized();
  }
  
  // Enforce organization scope
  const data = await db
    .collection(`organizations/${auth.orgId}/tras`)
    .get();
    
  return Response.json(data);
}
```

## 📱 Offline-First PWA Architectuur

### Drie-Laags Sync Strategie

**1. IndexedDB (Lokale Database)**
```typescript
// Queue Structure
interface OfflineQueue {
  lmraSessions: LMRASession[];
  photos: PhotoUpload[];
  projects: Project[];
  pendingActions: Action[];
}

// Max 50 entries, auto-cleanup oude items
```

**2. Service Worker (Caching)**
```typescript
// Cache Strategie
{
  'app-shell': CacheFirst,      // HTML, CSS, JS
  'firebase-data': NetworkFirst, // Firestore queries
  'images': CacheFirst,          // Uploaded photos
  'api-routes': NetworkFirst     // API calls
}
```

**3. Auto-Sync Manager**
```typescript
class OfflineSyncManager {
  // Triggers
  - Network reconnection (addEventListener('online'))
  - Periodic sync (elke 5 minuten)
  - Manual force sync
  
  // Retry Logic
  - 3 max attempts
  - Exponential backoff (5s, 15s, 45s)
  - Failed items stay in queue
}
```

**Conflict Resolution**: Last-Write-Wins met timestamp

## 🔄 Real-Time Data Synchronisatie

### Firestore Listeners Pattern

**Dashboard Real-Time Updates**:
```typescript
// Live LMRA Sessions Monitoring
const unsubscribe = db
  .collection(`organizations/${orgId}/lmraSessions`)
  .where('status', 'in', ['in_progress', 'pending_review'])
  .orderBy('startTime', 'desc')
  .limit(10)
  .onSnapshot((snapshot) => {
    // Update UI in real-time
    setLiveSessions(snapshot.docs);
    
    // Check for stop work alerts
    const stopWork = snapshot.docs.filter(
      doc => doc.data().assessment === 'stop_work'
    );
    if (stopWork.length > 0) {
      triggerCriticalAlert(stopWork);
    }
  });
```

**Optimalisatie**:
- Limit queries (max 100 docs)
- Unsubscribe on component unmount
- Cache previous results
- Debounce rapid updates (300ms)

## 🎯 API Route Patterns

### Standaard RESTful Structuur

```typescript
// Pattern voor alle entities
/api/{entity}/
  GET     - List met filtering/pagination
  POST    - Create nieuwe resource
  
/api/{entity}/{id}/
  GET     - Retrieve specifieke resource
  PATCH   - Update specifieke resource
  DELETE  - Delete (soft delete met deletedAt)
  
/api/{entity}/{id}/{action}/
  POST    - Custom action (approve, submit, etc.)
```

**Request/Response Format**:
```typescript
// Success Response
{
  success: true,
  data: T,
  pagination?: {
    total: number,
    page: number,
    pageSize: number,
    hasMore: boolean
  }
}

// Error Response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Gebruiksvriendelijk bericht',
    field?: 'specificVeld',
    details?: {...}
  }
}
```

## 🔍 Search Architectuur

### Custom Firebase Search (Zero-Cost)

**Multi-Entity Search Service**:
```typescript
class FirebaseSearchService {
  // Capabilities
  - Multi-entity (TRAs, Templates, Hazards, Projects)
  - Weighted field scoring (title=3x, description=2x, tags=2x)
  - Typo-tolerant matching
  - Faceted filtering (15+ filter types)
  - Pagination (cursor-based)
  - Caching (LRU with TTL)
  
  // Performance
  - Query time: <100ms target
  - Cache hit rate: >80%
  - Field selection: 40-60% data reduction
}
```

**Search Algorithm**:
```typescript
function calculateRelevance(doc, query, weights) {
  let score = 0;
  
  // Exact match bonus
  if (doc.title.toLowerCase() === query.toLowerCase()) {
    score += 10;
  }
  
  // Weighted field matches
  score += matchScore(doc.title, query) * weights.title;
  score += matchScore(doc.description, query) * weights.description;
  score += matchScore(doc.tags, query) * weights.tags;
  
  // Recency bonus (newer docs rank higher)
  const daysSinceCreated = (now - doc.createdAt) / DAY_MS;
  score += Math.max(0, 5 - daysSinceCreated / 30);
  
  return score;
}
```

## 📊 Performance Optimization Patterns

### Multi-Level Caching Strategie

**1. Browser Cache**
```typescript
// Service Worker: App Shell (1 week)
// IndexedDB: Offline data (until sync)
// Memory: Component state (session)
```

**2. Application Cache**
```typescript
// LRU Cache met TTL
{
  TRAs: {
    maxSize: 20MB,
    ttl: 5 * 60 * 1000,      // 5 minuten
    maxEntries: 500
  },
  Templates: {
    maxSize: 10MB,
    ttl: 15 * 60 * 1000,     // 15 minuten (minder volatiel)
    maxEntries: 200
  },
  LMRA: {
    maxSize: 15MB,
    ttl: 2 * 60 * 1000,      // 2 minuten (real-time)
    maxEntries: 300
  }
}
```

**3. CDN Cache (Vercel Edge)**
```typescript
// Static assets: 1 jaar
// API responses: No cache (dynamic)
// Images: 1 maand met revalidatie
```

### Query Optimization

**Field Selection** (40-60% reduction):
```typescript
// Bad: Fetch everything
const tras = await db.collection('tras').get();

// Good: Select only needed fields
const tras = await db.collection('tras')
  .select('id', 'title', 'status', 'createdAt')
  .get();
```

**Batch Operations** (70%+ reduction):
```typescript
// Bad: Individual gets
for (const id of ids) {
  await db.doc(`tras/${id}`).get();  // N queries
}

// Good: Batch get
const refs = ids.map(id => db.doc(`tras/${id}`));
await db.getAll(...refs);  // 1 query
```

## 🔒 Security Patterns

### Defense in Depth

**Layer 1: Firestore Rules**
```javascript
// Enforce organization + role at database level
```

**Layer 2: API Validation**
```typescript
// Zod schema validation voor alle inputs
const createTRASchema = z.object({
  title: z.string().min(3).max(200),
  projectId: z.string().uuid(),
  // ...
});
```

**Layer 3: RBAC Middleware**
```typescript
// Verify role has permission voor action
if (!hasPermission(auth.role, 'create:tra')) {
  return forbidden();
}
```

**Layer 4: Rate Limiting**
```typescript
// Upstash Redis: 100 req/min per user
```

## 📈 Monitoring & Observability

### Custom Performance Traces

**13 Trace Types**:
```typescript
// TRA Operations
- tra_create, tra_load, tra_update, tra_approve, tra_export_pdf

// LMRA Operations
- lmra_start, lmra_execute, lmra_complete, lmra_stop_work

// Report Operations
- report_pdf, report_excel, report_data_load

// Dashboard
- dashboard_load
```

**Web Vitals Tracking**:
```typescript
{
  LCP: <2500ms,  // Largest Contentful Paint
  FID: <100ms,   // First Input Delay
  CLS: <0.1,     // Cumulative Layout Shift
  FCP: <1800ms,  // First Contentful Paint
  TTFB: <800ms   // Time to First Byte
}
```

## 🔄 Data Migration Pattern

**Safe Migration Template**:
```typescript
async function migrateData() {
  // 1. Dry run eerst
  const { changes, errors } = await migrate({ dryRun: true });
  console.log(`Will modify ${changes.length} docs`);
  
  // 2. Backup kritieke data
  await createBackup(collectionName);
  
  // 3. Batch processing (50 per batch)
  for (const batch of chunks(docs, 50)) {
    await processBatch(batch);
    await sleep(100);  // Rate limiting
  }
  
  // 4. Validation
  await validateMigration();
  
  // 5. Rollback optie beschikbaar
  return { success, rollbackFn };
}
```

## 🎨 UI Component Patterns

### Compound Component Pattern

**Voorbeeld: TraWizard**
```typescript
<TraWizard>
  <TraWizard.BasicInfo />
  <TraWizard.TaskSteps />
  <TraWizard.Hazards />
  <TraWizard.ControlMeasures />
  <TraWizard.Review />
</TraWizard>

// Shared state via Context
// Step validation
// Progress tracking
```

### Form Handling Pattern

```typescript
// React Hook Form + Zod
const form = useForm<TRAInput>({
  resolver: zodResolver(createTRASchema),
  defaultValues: { ... }
});

// Optimistic updates
const mutation = useMutation({
  onMutate: (data) => updateCache(data),
  onError: (error) => revertCache(),
  onSuccess: (data) => confirmCache(data)
});
```

## 💡 Key Design Decisions

### Waarom Deze Patronen?

1. **Multi-Tenant**: Compliance + security vereist complete isolatie
2. **Offline-First**: Bouwplaatsen hebben geen betrouwbaar internet
3. **RBAC**: Veiligheidsindustrie heeft strikte authorization nodig
4. **Custom Search**: €0 kosten vs €50-200/maand voor Algolia
5. **Real-Time**: Safety-critical alerts moeten onmiddellijk zijn
6. **Caching**: Mobile performance op bouwplaatsen essentieel

### Trade-offs Gemaakt

| Decision | Pro | Con | Rationale |
|----------|-----|-----|-----------|
| Firebase | Zero DevOps | Vendor lock-in | Solo dev, speed to market |
| Custom Search | €0 cost | No fuzzy search | Budget constraints, good enough |
| React 19 | Latest features | Less stable | Next.js 15 requirement |
| Monorepo | Organized | Complex deploy | Functions + Web app together |
| Dutch-Only | Local market | Not global | Target market focus |
