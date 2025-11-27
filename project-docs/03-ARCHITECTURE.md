# SafeWork Pro - Architecture Guide

**Document Version**: 1.0  
**Last Updated**: October 31, 2025  
**Architecture Type**: Multi-tenant SaaS, Offline-first PWA  
**Tech Stack**: Next.js 15, React 19, Firebase, Vercel

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Application Architecture](#application-architecture)
3. [Data Architecture](#data-architecture)
4. [Security Architecture](#security-architecture)
5. [Integration Architecture](#integration-architecture)
6. [Offline Architecture](#offline-architecture)
7. [API Architecture](#api-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance Architecture](#performance-architecture)
10. [Monitoring Architecture](#monitoring-architecture)

---

## 🏗️ System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 App (React 19)                                  │
│  ├─ PWA (Service Worker + Manifest)                         │
│  ├─ Offline-first (IndexedDB)                               │
│  └─ Real-time UI (Firestore listeners)                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      EDGE NETWORK LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Vercel Edge Network                                         │
│  ├─ Edge Functions (API Routes)                             │
│  ├─ CDN (Static Assets)                                     │
│  └─ Middleware (Auth, Rate Limiting)                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES LAYER                   │
├─────────────────────────────────────────────────────────────┤
│  Firebase                                                    │
│  ├─ Firestore (Database)                                    │
│  ├─ Auth (Authentication)                                   │
│  ├─ Storage (Files)                                         │
│  └─ Functions (Serverless)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   THIRD-PARTY SERVICES LAYER                 │
├─────────────────────────────────────────────────────────────┤
│  ├─ Stripe (Payments)                                       │
│  ├─ Resend (Email)                                          │
│  ├─ OpenWeather (Weather Data)                             │
│  └─ Sentry (Error Tracking)                                │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Multi-Tenant**: Complete data isolation per organization
2. **Offline-First**: Works without internet connection
3. **Real-Time**: Live updates via Firestore listeners
4. **Scalable**: Serverless architecture, auto-scaling
5. **Secure**: RBAC, encryption, security rules
6. **Fast**: Edge network, caching, optimizations
7. **Reliable**: Retry logic, error handling, monitoring

---

## 🎨 Application Architecture

### Next.js App Router Structure

```
web/src/
├── app/                          # Next.js 15 App Router
│   ├── [locale]/                 # Internationalization
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── tras/                 # TRA management
│   │   ├── lmras/                # LMRA execution
│   │   ├── approvals/            # Approval workflow
│   │   ├── reports/              # Analytics & reports
│   │   ├── settings/             # Settings pages
│   │   └── profile/              # User profile
│   ├── api/                      # API routes (Edge Functions)
│   │   ├── tras/                 # TRA CRUD operations
│   │   ├── lmras/                # LMRA operations
│   │   ├── approvals/            # Approval operations
│   │   ├── stripe/               # Payment webhooks
│   │   ├── weather/              # Weather API proxy
│   │   └── dev/                  # Development utilities
│   └── auth/                     # Authentication pages
│       ├── login/
│       ├── register/
│       └── reset-password/
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout components
│   ├── tras/                     # TRA components
│   ├── lmras/                    # LMRA components
│   ├── approvals/                # Approval components
│   └── templates/                # Template components
├── lib/                          # Business logic & utilities
│   ├── firebase/                 # Firebase SDK wrappers
│   ├── stripe/                   # Stripe integration
│   ├── notifications/            # Email notifications
│   ├── services/                 # Business services
│   └── utils/                    # Utility functions
├── types/                        # TypeScript type definitions
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── messages/                     # i18n translations
└── styles/                       # Global styles
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  React Components (UI)                                       │
│  ├─ Pages (Next.js App Router)                              │
│  ├─ Layouts (DashboardLayout, AuthLayout)                   │
│  ├─ Feature Components (TraWizard, LMRAWizard)              │
│  └─ UI Components (Button, Modal, Form)                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT LAYER                  │
├─────────────────────────────────────────────────────────────┤
│  React State & Contexts                                      │
│  ├─ AuthContext (User authentication state)                 │
│  ├─ OrganizationContext (Current organization)              │
│  ├─ ThemeContext (UI theme)                                 │
│  └─ Local State (useState, useReducer)                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  Services & Utilities                                        │
│  ├─ TraService (TRA operations)                             │
│  ├─ LMRAService (LMRA operations)                           │
│  ├─ ApprovalService (Approval workflow)                     │
│  ├─ NotificationService (Email notifications)               │
│  ├─ WeatherService (Weather data)                           │
│  └─ OfflineSyncManager (Offline sync)                       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Firebase SDK Wrappers                                       │
│  ├─ Firestore Client (Database operations)                  │
│  ├─ Auth Client (Authentication)                            │
│  ├─ Storage Client (File uploads)                           │
│  └─ IndexedDB (Offline storage)                             │
└─────────────────────────────────────────────────────────────┘
```

### State Management Strategy

**Global State** (React Context):
- `AuthContext`: User authentication, session management
- `OrganizationContext`: Current organization data
- `ThemeContext`: UI theme preferences

**Server State** (Firestore Real-time):
- TRAs, LMRAs, Approvals (live updates)
- User profiles, Organization settings
- Real-time collaboration

**Local State** (React useState/useReducer):
- Form inputs, UI state
- Temporary data, drafts
- Component-specific state

**Offline State** (IndexedDB):
- Cached TRAs for offline access
- Pending sync queue
- Offline photos and signatures

---

## 💾 Data Architecture

### Firestore Database Schema

```
/organizations/{orgId}
  - name: string
  - domain: string
  - settings: object
  - subscription: object
    - plan: 'starter' | 'professional' | 'enterprise'
    - status: 'active' | 'canceled' | 'past_due'
    - currentPeriodEnd: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp

/organizations/{orgId}/users/{userId}
  - email: string
  - displayName: string
  - role: 'admin' | 'safety_manager' | 'supervisor' | 'field_worker'
  - photoURL: string
  - competencies: array
  - createdAt: timestamp
  - lastLoginAt: timestamp

/organizations/{orgId}/projects/{projectId}
  - name: string
  - location: geopoint
  - address: string
  - status: 'active' | 'completed' | 'archived'
  - startDate: timestamp
  - endDate: timestamp
  - createdBy: string (userId)
  - createdAt: timestamp

/organizations/{orgId}/tras/{traId}
  - templateId: string
  - projectId: string
  - title: string
  - description: string
  - status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  - steps: array
    - stepNumber: number
    - title: string
    - content: object
    - completed: boolean
  - hazards: array
    - hazardId: string
    - description: string
    - riskScore: number
    - controlMeasures: array
  - approvalWorkflow: object
    - steps: array
    - currentStep: number
    - status: string
  - createdBy: string (userId)
  - createdAt: timestamp
  - updatedAt: timestamp
  - approvedAt: timestamp
  - approvedBy: string (userId)

/organizations/{orgId}/lmras/{lmraId}
  - traId: string
  - projectId: string
  - location: geopoint
  - weather: object
    - temperature: number
    - windSpeed: number
    - conditions: string
    - safe: boolean
  - team: array
    - userId: string
    - name: string
    - competencies: array
  - hazards: array
  - controlMeasures: array
  - equipment: array
  - photos: array
  - signatures: array
  - decision: 'proceed' | 'stop_work' | 'pending'
  - stopWork: object (if decision === 'stop_work')
    - reason: string
    - immediateAction: string
    - photos: array
    - signature: string
  - status: 'in_progress' | 'completed' | 'stopped'
  - createdBy: string (userId)
  - createdAt: timestamp
  - completedAt: timestamp

/organizations/{orgId}/approvals/{approvalId}
  - type: 'tra' | 'lmra' | 'other'
  - entityId: string (traId or lmraId)
  - workflow: object
    - steps: array
      - stepNumber: number
      - approverRole: string
      - approverId: string
      - status: 'pending' | 'approved' | 'rejected'
      - decision: string
      - comment: string
      - decidedAt: timestamp
  - currentStep: number
  - status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  - createdBy: string (userId)
  - createdAt: timestamp
  - completedAt: timestamp

/traTemplates/{templateId}
  - name: string
  - description: string
  - category: string
  - vcaCompliant: boolean
  - steps: array
  - hazards: array
  - isSystemTemplate: boolean
  - createdAt: timestamp

/organizations/{orgId}/traTemplates/{templateId}
  - (same structure as system templates)
  - isSystemTemplate: false
  - customizedBy: string (userId)
```

### Data Relationships

```
Organization (1) ──┬── (N) Users
                   ├── (N) Projects
                   ├── (N) TRAs
                   ├── (N) LMRAs
                   ├── (N) Approvals
                   └── (N) Custom Templates

Project (1) ──┬── (N) TRAs
              └── (N) LMRAs

TRA (1) ──┬── (N) LMRAs
          ├── (1) Approval
          └── (1) Template

User (1) ──┬── (N) Created TRAs
           ├── (N) Created LMRAs
           └── (N) Approvals (as approver)
```

### Data Access Patterns

**Read Patterns**:
1. **Dashboard**: List TRAs/LMRAs for organization (paginated)
2. **TRA Detail**: Get single TRA with related data
3. **Approval Inbox**: List pending approvals for user
4. **Reports**: Aggregate data across organization

**Write Patterns**:
1. **Create TRA**: Write to `/organizations/{orgId}/tras/`
2. **Submit for Approval**: Update TRA + Create Approval
3. **Approve TRA**: Update Approval + Update TRA status
4. **Execute LMRA**: Create LMRA linked to TRA

**Real-time Patterns**:
1. **Live TRA Updates**: Firestore listener on TRA document
2. **Approval Notifications**: Listener on user's approvals
3. **Stop-Work Alerts**: Listener on organization's LMRAs

---

## 🔒 Security Architecture

### Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Login Request
     ↓
┌─────────────────┐
│  Next.js Auth   │
│     Page        │
└────┬────────────┘
     │ 2. Firebase Auth
     ↓
┌─────────────────┐
│  Firebase Auth  │
│    Service      │
└────┬────────────┘
     │ 3. ID Token + Custom Claims
     ↓
┌─────────────────┐
│  AuthContext    │
│  (Client State) │
└────┬────────────┘
     │ 4. Authenticated Requests
     ↓
┌─────────────────┐
│  API Routes     │
│  (Middleware)   │
└────┬────────────┘
     │ 5. Verify Token
     ↓
┌─────────────────┐
│  Firestore      │
│  (RBAC Rules)   │
└─────────────────┘
```

### Role-Based Access Control (RBAC)

**Roles**:
1. **ADMIN**: Full system access
2. **SAFETY_MANAGER**: Manage TRAs, approve, reports
3. **SUPERVISOR**: Create TRAs, execute LMRAs, approve
4. **FIELD_WORKER**: Execute LMRAs, view assigned TRAs

**Permission Matrix**:

| Action | Admin | Safety Manager | Supervisor | Field Worker |
|--------|-------|----------------|------------|--------------|
| Create TRA | ✅ | ✅ | ✅ | ❌ |
| Edit TRA | ✅ | ✅ | ✅ (own) | ❌ |
| Delete TRA | ✅ | ✅ | ❌ | ❌ |
| Approve TRA | ✅ | ✅ | ✅ | ❌ |
| Execute LMRA | ✅ | ✅ | ✅ | ✅ |
| Stop Work | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ (limited) | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Billing | ✅ | ❌ | ❌ | ❌ |

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function belongsToOrg(orgId) {
      return request.auth.token.organizationId == orgId;
    }
    
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    function isSafetyManager() {
      return getUserRole() in ['admin', 'safety_manager'];
    }
    
    function isSupervisor() {
      return getUserRole() in ['admin', 'safety_manager', 'supervisor'];
    }
    
    // Organization rules
    match /organizations/{orgId} {
      allow read: if isAuthenticated() && belongsToOrg(orgId);
      allow write: if isAuthenticated() && belongsToOrg(orgId) && isAdmin();
      
      // Users subcollection
      match /users/{userId} {
        allow read: if isAuthenticated() && belongsToOrg(orgId);
        allow write: if isAuthenticated() && belongsToOrg(orgId) && 
                       (isAdmin() || request.auth.uid == userId);
      }
      
      // TRAs subcollection
      match /tras/{traId} {
        allow read: if isAuthenticated() && belongsToOrg(orgId);
        allow create: if isAuthenticated() && belongsToOrg(orgId) && isSupervisor();
        allow update: if isAuthenticated() && belongsToOrg(orgId) && 
                        (isSafetyManager() || resource.data.createdBy == request.auth.uid);
        allow delete: if isAuthenticated() && belongsToOrg(orgId) && isSafetyManager();
      }
      
      // LMRAs subcollection
      match /lmras/{lmraId} {
        allow read: if isAuthenticated() && belongsToOrg(orgId);
        allow create: if isAuthenticated() && belongsToOrg(orgId);
        allow update: if isAuthenticated() && belongsToOrg(orgId) && 
                        resource.data.createdBy == request.auth.uid;
        allow delete: if isAuthenticated() && belongsToOrg(orgId) && isSafetyManager();
      }
      
      // Approvals subcollection
      match /approvals/{approvalId} {
        allow read: if isAuthenticated() && belongsToOrg(orgId);
        allow create: if isAuthenticated() && belongsToOrg(orgId) && isSupervisor();
        allow update: if isAuthenticated() && belongsToOrg(orgId) && isSupervisor();
        allow delete: if isAuthenticated() && belongsToOrg(orgId) && isAdmin();
      }
    }
    
    // System templates (read-only for all authenticated users)
    match /traTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via Firebase Admin SDK
    }
  }
}
```

### Data Encryption

**At Rest**:
- Firestore: Automatic encryption (AES-256)
- Firebase Storage: Automatic encryption
- IndexedDB: Browser-level encryption

**In Transit**:
- HTTPS/TLS 1.3 for all connections
- Firebase SDK: Encrypted connections
- API Routes: Vercel Edge with TLS

**Sensitive Data**:
- Passwords: Firebase Auth (bcrypt)
- API Keys: Environment variables
- Tokens: HTTP-only cookies

---

## 🔌 Integration Architecture

### Stripe Payment Integration

```
┌─────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                            │
└─────────────────────────────────────────────────────────────┘

User clicks "Subscribe"
        ↓
Next.js API Route: /api/stripe/create-checkout
        ↓
Create Stripe Checkout Session
        ↓
Redirect to Stripe Checkout
        ↓
User completes payment
        ↓
Stripe sends webhook to /api/stripe/webhook
        ↓
Verify webhook signature
        ↓
Update Firestore subscription status
        ↓
Send confirmation email (Resend)
```

**Stripe Components**:
- **Checkout Sessions**: One-time payment flow
- **Customer Portal**: Self-service billing
- **Webhooks**: Event notifications
- **Subscriptions**: Recurring billing
- **Usage Records**: Track API usage

### Resend Email Integration

```
┌─────────────────────────────────────────────────────────────┐
│                      EMAIL FLOW                              │
└─────────────────────────────────────────────────────────────┘

Trigger event (TRA approved, stop-work, etc.)
        ↓
NotificationService.sendEmail()
        ↓
Select email template
        ↓
Render template with data
        ↓
Resend API call
        ↓
Retry logic (3 attempts, exponential backoff)
        ↓
Log result (success/failure)
```

**Email Templates**:
- Welcome, Password Reset, Email Verification
- TRA Approval Request, Approved, Rejected
- LMRA Stop-Work Alert, Completion
- Subscription Created, Updated, Cancelled
- Payment Succeeded, Failed
- Trial Ending, Competency Expiry

### OpenWeather API Integration

```
┌─────────────────────────────────────────────────────────────┐
│                      WEATHER FLOW                            │
└─────────────────────────────────────────────────────────────┘

LMRA Step 3: Weather Conditions
        ↓
Get GPS coordinates (browser geolocation)
        ↓
Call /api/weather with lat/lon
        ↓
Check cache (1-hour TTL)
        ↓
If cache miss: Call OpenWeather API
        ↓
Apply safety rules (wind, temp, visibility)
        ↓
Return weather + safety assessment
        ↓
Display in UI with recommendations
```

**Safety Rules**:
- Wind speed limits (general: 60 km/h, height: 40 km/h)
- Temperature limits (electrical: -10°C to 40°C)
- Visibility limits (confined space: 1000m min)
- Rain intensity (electrical: no heavy rain)
- Lightning detection (hot work: no thunderstorms)

---

## 📱 Offline Architecture

### Service Worker Strategy

```javascript
// Cache Strategy
const CACHE_NAME = 'safework-pro-v1';

// Cache-First Strategy (Static Assets)
- HTML, CSS, JavaScript
- Images, Icons, Fonts
- Fallback to network if cache miss

// Network-First Strategy (API Calls)
- TRA/LMRA data
- User profiles
- Fallback to cache if offline

// Cache-Only Strategy (Offline Pages)
- Offline fallback page
- Cached TRAs for offline access
```

### IndexedDB Schema

```javascript
// Database: safework-pro
// Version: 1

// Object Stores:
1. tras
   - keyPath: 'id'
   - indexes: ['organizationId', 'status', 'createdAt']
   
2. lmras
   - keyPath: 'id'
   - indexes: ['traId', 'status', 'createdAt']
   
3. syncQueue
   - keyPath: 'id'
   - indexes: ['type', 'status', 'createdAt']
   
4. photos
   - keyPath: 'id'
   - indexes: ['lmraId', 'uploaded']
   
5. signatures
   - keyPath: 'id'
   - indexes: ['lmraId', 'uploaded']
```

### Offline Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      OFFLINE SYNC FLOW                       │
└─────────────────────────────────────────────────────────────┘

User performs action while offline
        ↓
Save to IndexedDB
        ↓
Add to sync queue
        ↓
Display "Pending sync" indicator
        ↓
Network comes back online
        ↓
OfflineSyncManager detects connection
        ↓
Process sync queue (FIFO)
        ↓
For each item:
  - Upload to Firestore
  - Upload photos to Storage
  - Retry on failure (exponential backoff)
  - Remove from queue on success
        ↓
Update UI with sync status
        ↓
Show success notification
```

### Conflict Resolution

**Strategy**: Last-Write-Wins (LWW)

```javascript
// Conflict detection
if (serverTimestamp > localTimestamp) {
  // Server version is newer
  overwriteLocal();
} else {
  // Local version is newer
  uploadToServer();
}

// For critical data (stop-work):
// Always prefer local version
// Server never overwrites local stop-work data
```

---

## 🌐 API Architecture

### RESTful API Design

**Base URL**: `https://safeworkpro.nl/api`

**Endpoints**:

```
# TRAs
GET    /api/tras                    # List TRAs (paginated)
POST   /api/tras                    # Create TRA
GET    /api/tras/:id                # Get TRA by ID
PUT    /api/tras/:id                # Update TRA
DELETE /api/tras/:id                # Delete TRA
POST   /api/tras/:id/submit         # Submit for approval

# LMRAs
GET    /api/lmras                   # List LMRAs
POST   /api/lmras                   # Create LMRA
GET    /api/lmras/:id               # Get LMRA by ID
PUT    /api/lmras/:id               # Update LMRA
POST   /api/lmras/:id/stop-work    # Trigger stop-work

# Approvals
GET    /api/approvals               # List approvals
POST   /api/approvals/create        # Create approval
GET    /api/approvals/:id           # Get approval by ID
POST   /api/approvals/:id/approve   # Approve
POST   /api/approvals/:id/reject    # Reject

# Stripe
POST   /api/stripe/create-checkout  # Create checkout session
POST   /api/stripe/create-portal    # Create billing portal
POST   /api/stripe/webhook          # Webhook handler
GET    /api/stripe/subscription     # Get subscription status

# Weather
GET    /api/weather?lat=X&lon=Y     # Get weather data

# Dev (development only)
POST   /api/dev/seed-lmra           # Seed test LMRA
POST   /api/dev/seed-stopwork       # Seed stop-work
GET    /api/dev/dump-store          # Dump IndexedDB
```

### API Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-10-31T22:00:00Z",
    "requestId": "req_123456"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-10-31T22:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Rate Limiting

**Strategy**: Token Bucket Algorithm

```javascript
// Rate limits per plan
const RATE_LIMITS = {
  starter: {
    requests: 100,
    window: '1m'  // 100 requests per minute
  },
  professional: {
    requests: 500,
    window: '1m'
  },
  enterprise: {
    requests: 2000,
    window: '1m'
  }
};

// Implementation
// Using Vercel Edge Config + in-memory cache
// Fallback to Upstash Redis (planned)
```

---

## 🚀 Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                     │
├─────────────────────────────────────────────────────────────┤
│  Global CDN (300+ locations)                                 │
│  ├─ Static Assets (HTML, CSS, JS, Images)                   │
│  ├─ Edge Functions (API Routes)                             │
│  └─ Edge Middleware (Auth, Rate Limiting)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      FIREBASE BACKEND                        │
├─────────────────────────────────────────────────────────────┤
│  ├─ Firestore (Multi-region: europe-west1)                  │
│  ├─ Auth (Global)                                            │
│  ├─ Storage (europe-west1)                                  │
│  └─ Functions (europe-west1)                                │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

**Development**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=dev_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dev-project
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
```

**Staging**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=staging_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=staging-project
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...
```

**Production**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=prod_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prod-project
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_live_...
OPENWEATHER_API_KEY=prod_key
SENTRY_DSN=https://...
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                          │
└─────────────────────────────────────────────────────────────┘

Git Push to main branch
        ↓
GitHub Actions triggered
        ↓
Run tests (Jest + Cypress)
        ↓
Build Next.js app
        ↓
Deploy to Vercel (automatic)
        ↓
Run smoke tests
        ↓
Notify team (Slack/Email)
```

---

## ⚡ Performance Architecture

### Performance Optimization Strategies

**1. Code Splitting**:
```javascript
// Dynamic imports for large components
const TraWizard = dynamic(() => import('@/components/forms/TraWizard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// Route-based code splitting (automatic with Next.js App Router)
```

**2. Image Optimization**:
```javascript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="SafeWork Pro"
  priority // For above-the-fold images
/>
```

**3. Caching Strategy**:
```javascript
// API Response Caching
const CACHE_DURATIONS = {
  weather: 3600,      // 1 hour
  templates: 86400,   // 24 hours
  static: 604800      // 7 days
};

// Firestore Query Caching
const trasQuery = query(
  collection(db, 'tras'),
  where('status', '==', 'approved')
);
// Firestore automatically caches query results
```

**4. Bundle Size Optimization**:
```javascript
// Tree shaking (automatic with ES modules)
// Import only what you need
import { Button } from '@/components/ui/button';

// Avoid importing entire libraries
import debounce from 'lodash/debounce'; // ✅ Good
import _ from 'lodash'; // ❌ Bad (imports entire library)
```

### Performance Budgets

```javascript
// performance-budgets.json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 250 // KB
        },
        {
          "resourceType": "total",
          "budget": 500 // KB
        }
      ]
    }
  ]
}
```

### Performance Metrics

**Target Metrics** (Lighthouse):
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

**Core Web Vitals**:
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

## 📊 Monitoring Architecture

### Error Tracking (Sentry)

```javascript
// Sentry Configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Custom error filtering
  beforeSend(event, hint) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    return event;
  },
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['safeworkpro.nl', /^\//],
    }),
  ],
});
```

### Performance Monitoring (Firebase)

```javascript
// Firebase Performance Monitoring
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// Custom traces
const traCreationTrace = trace(perf, 'tra_creation');
traCreationTrace.start();
// ... TRA creation logic
traCreationTrace.stop();

// Automatic traces
// - Page load times
// - Network requests
// - Firebase operations
```

### Analytics (Vercel Analytics)

```javascript
// Vercel Analytics (automatic)
// Tracks:
// - Page views
// - User sessions
// - Performance metrics
// - Geographic distribution

// Custom events
import { track } from '@vercel/analytics';

track('tra_created', {
  template: 'electrical_work',
  duration: 120 // seconds
});
```

### Health Monitoring

```javascript
// Health Check Endpoint
// /api/health

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firebase: await checkFirebase(),
      stripe: await checkStripe(),
      resend: await checkResend(),
      weather: await checkWeather(),
    }
  };
  
  return Response.json(health);
}
```

### Uptime Monitoring

**UptimeRobot Configuration** (Planned):
```
Monitor Type: HTTPS
URL: https://safeworkpro.nl/api/health
Interval: 5 minutes
Alert Contacts: team@safeworkpro.nl
```

### Logging Strategy

**Log Levels**:
1. **ERROR**: Critical errors requiring immediate attention
2. **WARN**: Warning conditions that should be reviewed
3. **INFO**: Informational messages about normal operations
4. **DEBUG**: Detailed debugging information (dev only)

**Log Destinations**:
- **Client Errors**: Sentry
- **Server Errors**: Vercel Logs + Sentry
- **Firebase Errors**: Firebase Console
- **Audit Logs**: Firestore collection

---

## 🔄 Data Flow Examples

### TRA Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      TRA CREATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User opens TRA Wizard
        ↓
2. Select template from Firestore
        ↓
3. Fill in wizard steps (client-side state)
        ↓
4. Auto-save draft to IndexedDB (offline support)
        ↓
5. Submit TRA
        ↓
6. POST /api/tras
        ↓
7. Validate data (server-side)
        ↓
8. Check subscription limits
        ↓
9. Write to Firestore
        ↓
10. Create approval workflow
        ↓
11. Send notification to approvers (Resend)
        ↓
12. Return success response
        ↓
13. Update UI with new TRA
        ↓
14. Clear draft from IndexedDB
```

### LMRA Execution Flow (Offline)

```
┌─────────────────────────────────────────────────────────────┐
│                  LMRA EXECUTION FLOW (OFFLINE)               │
└─────────────────────────────────────────────────────────────┘

1. Field worker opens LMRA (offline)
        ↓
2. Load TRA from IndexedDB cache
        ↓
3. Complete 8-step workflow
   - Step 1: Work description & location (GPS)
   - Step 2: Team & competencies
   - Step 3: Weather conditions (cached)
   - Step 4: Hazard identification
   - Step 5: Control measures
   - Step 6: Equipment check (QR scan)
   - Step 7: Work permit
   - Step 8: Final approval & signatures
        ↓
4. Capture photos (store in IndexedDB)
        ↓
5. Capture signatures (store in IndexedDB)
        ↓
6. Save LMRA to IndexedDB
        ↓
7. Add to sync queue
        ↓
8. Display "Pending sync" indicator
        ↓
9. Network comes back online
        ↓
10. OfflineSyncManager processes queue
        ↓
11. Upload LMRA to Firestore
        ↓
12. Upload photos to Firebase Storage
        ↓
13. Send completion notification (Resend)
        ↓
14. Remove from sync queue
        ↓
15. Update UI with "Synced" status
```

### Stop-Work Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      STOP-WORK FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Field worker clicks "Stop Work" button
        ↓
2. Show stop-work modal
        ↓
3. Select reason (safety hazard, weather, equipment, etc.)
        ↓
4. Enter immediate action taken
        ↓
5. Capture photos (optional)
        ↓
6. Capture signature
        ↓
7. Submit stop-work
        ↓
8. Save to IndexedDB (if offline)
        ↓
9. POST /api/lmras/:id/stop-work
        ↓
10. Update LMRA status to 'stopped'
        ↓
11. Create stop-work record in Firestore
        ↓
12. Trigger real-time alert (Firestore listener)
        ↓
13. Send email to supervisors (Resend)
        ↓
14. Send in-app notification
        ↓
15. Update dashboard with stop-work alert
        ↓
16. Supervisor acknowledges stop-work
        ↓
17. Investigation and resolution process
```

---

## 🏗️ Architecture Decisions

### Why Next.js 15?

**Pros**:
- ✅ App Router for better performance
- ✅ Server Components for reduced bundle size
- ✅ Built-in API routes (Edge Functions)
- ✅ Excellent TypeScript support
- ✅ Image optimization
- ✅ Automatic code splitting

**Cons**:
- ⚠️ Learning curve for App Router
- ⚠️ Some third-party libraries not compatible

**Decision**: Benefits outweigh drawbacks for our use case

### Why Firebase?

**Pros**:
- ✅ Real-time database (Firestore)
- ✅ Built-in authentication
- ✅ File storage
- ✅ Serverless functions
- ✅ Generous free tier
- ✅ Excellent SDK

**Cons**:
- ⚠️ Vendor lock-in
- ⚠️ Complex pricing at scale
- ⚠️ Limited query capabilities

**Decision**: Best fit for MVP, can migrate later if needed

### Why Vercel?

**Pros**:
- ✅ Seamless Next.js integration
- ✅ Global edge network
- ✅ Automatic deployments
- ✅ Preview deployments
- ✅ Built-in analytics
- ✅ Excellent DX

**Cons**:
- ⚠️ Can be expensive at scale
- ⚠️ Vendor lock-in

**Decision**: Best hosting for Next.js applications

### Why Offline-First?

**Pros**:
- ✅ Works on construction sites (poor connectivity)
- ✅ Better user experience
- ✅ Data safety (local backup)
- ✅ Faster perceived performance

**Cons**:
- ⚠️ Complex sync logic
- ⚠️ Conflict resolution needed
- ⚠️ Larger bundle size

**Decision**: Critical for target market (construction sites)

---

## 📚 Architecture Patterns

### Design Patterns Used

**1. Repository Pattern**:
```typescript
// Abstract data access
class TraRepository {
  async getById(id: string): Promise<TRA> {
    // Firestore implementation
  }
  
  async create(tra: TRA): Promise<string> {
    // Firestore implementation
  }
}
```

**2. Service Layer Pattern**:
```typescript
// Business logic separation
class TraService {
  constructor(private repo: TraRepository) {}
  
  async createTRA(data: CreateTRAInput): Promise<TRA> {
    // Validation
    // Business rules
    // Call repository
  }
}
```

**3. Observer Pattern**:
```typescript
// Real-time updates with Firestore listeners
const unsubscribe = onSnapshot(
  doc(db, 'tras', traId),
  (snapshot) => {
    // Update UI when data changes
  }
);
```

**4. Strategy Pattern**:
```typescript
// Different sync strategies
interface SyncStrategy {
  sync(item: SyncItem): Promise<void>;
}

class ImmediateSyncStrategy implements SyncStrategy {
  async sync(item: SyncItem) {
    // Sync immediately
  }
}

class BatchSyncStrategy implements SyncStrategy {
  async sync(item: SyncItem) {
    // Batch multiple items
  }
}
```

**5. Factory Pattern**:
```typescript
// Create different types of notifications
class NotificationFactory {
  static create(type: NotificationType): Notification {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'in-app':
        return new InAppNotification();
      case 'push':
        return new PushNotification();
    }
  }
}
```

---

## 🔐 Security Best Practices

### Input Validation

```typescript
// Zod schema validation
import { z } from 'zod';

const traSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000),
  projectId: z.string().uuid(),
  hazards: z.array(z.object({
    id: z.string(),
    description: z.string(),
    riskScore: z.number().min(1).max(25)
  }))
});

// Validate input
const result = traSchema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### SQL Injection Prevention

**Not Applicable**: Using Firestore (NoSQL), not vulnerable to SQL injection

### XSS Prevention

```typescript
// React automatically escapes output
// For raw HTML (avoid if possible):
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(dirtyHTML);
```

### CSRF Protection

```typescript
// Next.js API routes with SameSite cookies
// Vercel automatically handles CSRF for API routes
```

### Rate Limiting

```typescript
// Rate limit middleware
import rateLimit from '@/lib/rate-limit';

export async function POST(request: Request) {
  const identifier = request.headers.get('x-forwarded-for');
  const { success } = await rateLimit.check(identifier);
  
  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Process request
}
```

---

## 📖 Architecture Documentation

### Keeping Documentation Updated

**Process**:
1. Update architecture docs when making significant changes
2. Review architecture quarterly
3. Document all major decisions (ADRs)
4. Keep diagrams up-to-date

**Architecture Decision Records (ADRs)**:
- Document why decisions were made
- Include context, options considered, and rationale
- Store in `/docs/architecture/decisions/`

---

## 🎯 Future Architecture Considerations

### Scalability Improvements

**When to Consider**:
- 1000+ organizations
- 100,000+ users
- 1M+ TRAs/LMRAs

**Potential Changes**:
1. **Database Sharding**: Split Firestore by region
2. **Caching Layer**: Add Redis for frequently accessed data
3. **CDN**: Cloudflare for additional caching
4. **Search**: Algolia or Elasticsearch for advanced search
5. **Queue System**: Bull/BullMQ for background jobs

### Multi-Region Support

**Current**: Single region (europe-west1)
**Future**: Multi-region for global expansion
- US: us-central1
- Asia: asia-southeast1
- Data residency compliance

### Microservices Migration

**Current**: Monolithic Next.js app
**Future**: Potential microservices for:
- Compliance checking service
- Analytics service
- Notification service
- File processing service

---

**Document Status**: ✅ Complete  
**Last Updated**: October 31, 2025  
**Next Review**: Quarterly  
**Maintained By**: Development Team

---

**Navigation**:
- [← Back to Current State](02-CURRENT-STATE.md)
- [→ Next: Implementation Status](04-IMPLEMENTATION-STATUS.md)
- [↑ Back to Documentation Index](README.md)
