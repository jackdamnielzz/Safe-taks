# SafeWork Pro - Component Architecture & Folder Structure
## Next.js 14 + React 18 + TypeScript

**Version**: 1.0  
**Last Updated**: September 29, 2025  
**Status**: Foundation Architecture Complete  
**Related Documents**: [FEATURE_REQUIREMENTS.md](FEATURE_REQUIREMENTS.md:1), [FIRESTORE_DATA_MODEL.md](FIRESTORE_DATA_MODEL.md:1), [PROJECT_MEMORY.md](PROJECT_MEMORY.md:1)

---

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Component Catalog](#component-catalog)
5. [Component Patterns](#component-patterns)
6. [State Management](#state-management)
7. [Naming Conventions](#naming-conventions)
8. [File Organization](#file-organization)
9. [Testing Strategy](#testing-strategy)
10. [Performance Guidelines](#performance-guidelines)

---

## Overview

### Design Philosophy

**1. Component-First Architecture**
- Reusable, composable components
- Single Responsibility Principle
- Composition over inheritance
- Props-driven customization

**2. Server-First with Client Islands**
- Leverage Next.js 14 Server Components by default
- Client Components only where interactivity needed
- Minimize client-side JavaScript bundle
- Progressive enhancement approach

**3. Type Safety Throughout**
- TypeScript strict mode
- Zod for runtime validation
- Type-safe props and state
- Type-safe API calls

**4. Accessibility & Performance**
- WCAG 2.1 AA compliance
- Mobile-first responsive design
- Lazy loading and code splitting
- Optimistic UI updates

---

## Folder Structure

### Complete Directory Tree

```
web/
├── public/                          # Static assets
│   ├── icons/                       # App icons for PWA
│   ├── images/                      # Static images
│   └── manifest.json                # PWA manifest
│
├── src/
│   ├── app/                         # Next.js 14 App Router
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css              # Global styles
│   │   ├── not-found.tsx            # 404 page
│   │   ├── error.tsx                # Error boundary
│   │   │
│   │   ├── (marketing)/             # Marketing route group
│   │   │   ├── layout.tsx           # Marketing layout
│   │   │   ├── pricing/             # Pricing page
│   │   │   ├── features/            # Features page
│   │   │   └── about/               # About page
│   │   │
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── layout.tsx           # Auth layout (centered, minimal)
│   │   │   ├── login/               # Login page
│   │   │   ├── register/            # Registration page
│   │   │   ├── forgot-password/     # Password reset
│   │   │   └── verify-email/        # Email verification
│   │   │
│   │   ├── (dashboard)/             # Dashboard route group (authenticated)
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── tras/                # TRA Management
│   │   │   │   ├── page.tsx         # TRA list
│   │   │   │   ├── new/             # Create TRA
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [id]/            # TRA details/edit
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── edit/
│   │   │   │   │   └── history/
│   │   │   │   └── templates/       # TRA templates
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── lmra/                # LMRA Execution
│   │   │   │   ├── page.tsx         # LMRA list
│   │   │   │   ├── execute/         # Execute LMRA
│   │   │   │   │   └── [traId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── history/         # LMRA history
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── projects/            # Project Management
│   │   │   │   ├── page.tsx         # Project list
│   │   │   │   ├── new/             # Create project
│   │   │   │   └── [id]/            # Project details
│   │   │   │       ├── page.tsx
│   │   │   │       └── team/        # Team management
│   │   │   │
│   │   │   ├── reports/             # Reporting & Analytics
│   │   │   │   ├── page.tsx         # Reports dashboard
│   │   │   │   ├── compliance/      # Compliance reports
│   │   │   │   ├── risk-analysis/   # Risk analysis
│   │   │   │   └── custom/          # Custom report builder
│   │   │   │
│   │   │   ├── team/                # Team Management
│   │   │   │   ├── page.tsx         # Team list
│   │   │   │   ├── [userId]/        # User profile
│   │   │   │   └── competencies/    # Competency management
│   │   │   │
│   │   │   └── settings/            # Organization Settings
│   │   │       ├── page.tsx         # General settings
│   │   │       ├── organization/    # Org settings
│   │   │       ├── billing/         # Billing & subscription
│   │   │       ├── notifications/   # Notification preferences
│   │   │       └── security/        # Security settings
│   │   │
│   │   └── api/                     # API routes
│   │       ├── auth/                # Authentication endpoints
│   │       │   ├── login/
│   │       │   ├── logout/
│   │       │   ├── register/
│   │       │   └── refresh/
│   │       ├── tras/                # TRA CRUD
│   │       ├── lmra/                # LMRA operations
│   │       ├── projects/            # Project operations
│   │       ├── users/               # User management
│   │       ├── reports/             # Report generation
│   │       └── webhooks/            # External webhooks
│   │           └── stripe/
│   │
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Select.tsx           # NEW
│   │   │   ├── Checkbox.tsx         # NEW
│   │   │   ├── Radio.tsx            # NEW
│   │   │   ├── Switch.tsx           # NEW
│   │   │   ├── Tabs.tsx             # NEW
│   │   │   ├── Table.tsx            # NEW
│   │   │   ├── Pagination.tsx       # NEW
│   │   │   ├── Tooltip.tsx          # NEW
│   │   │   ├── Dropdown.tsx         # NEW
│   │   │   ├── Progress.tsx         # NEW
│   │   │   └── Toast.tsx            # NEW
│   │   │
│   │   ├── layouts/                 # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── MarketingLayout.tsx  # NEW
│   │   │   ├── AuthLayout.tsx       # NEW
│   │   │   ├── FormContainer.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Sidebar.tsx          # NEW
│   │   │   ├── Header.tsx           # NEW
│   │   │   └── Footer.tsx           # NEW
│   │   │
│   │   ├── navigation/              # Navigation components
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── NavBar.tsx           # NEW
│   │   │   ├── SideNav.tsx          # NEW
│   │   │   ├── UserMenu.tsx         # NEW
│   │   │   └── NotificationBell.tsx # NEW
│   │   │
│   │   ├── forms/                   # Form components
│   │   │   ├── TRAForm/             # TRA creation form
│   │   │   │   ├── TRAForm.tsx
│   │   │   │   ├── TaskStepForm.tsx
│   │   │   │   ├── HazardForm.tsx
│   │   │   │   ├── ControlMeasureForm.tsx
│   │   │   │   └── RiskCalculator.tsx
│   │   │   ├── LMRAForm/            # LMRA execution form
│   │   │   │   ├── LMRAForm.tsx
│   │   │   │   ├── LocationCheck.tsx
│   │   │   │   ├── WeatherCheck.tsx
│   │   │   │   ├── TeamCheck.tsx
│   │   │   │   └── EquipmentCheck.tsx
│   │   │   ├── ProjectForm/         # Project management
│   │   │   │   └── ProjectForm.tsx
│   │   │   ├── UserForm/            # User management
│   │   │   │   ├── UserForm.tsx
│   │   │   │   └── CompetencyForm.tsx
│   │   │   └── SearchForm.tsx       # NEW - Generic search
│   │   │
│   │   ├── tra/                     # TRA-specific components
│   │   │   ├── TRACard.tsx
│   │   │   ├── TRAList.tsx
│   │   │   ├── TRADetail.tsx
│   │   │   ├── TRATimeline.tsx      # NEW
│   │   │   ├── RiskMatrix.tsx       # NEW
│   │   │   ├── HazardLibrary.tsx    # NEW
│   │   │   ├── TemplateSelector.tsx # NEW
│   │   │   └── ApprovalWorkflow.tsx # NEW
│   │   │
│   │   ├── lmra/                    # LMRA-specific components
│   │   │   ├── LMRACard.tsx
│   │   │   ├── LMRAList.tsx
│   │   │   ├── LMRAExecutionFlow.tsx
│   │   │   ├── PhotoCapture.tsx     # NEW
│   │   │   ├── GPSLocation.tsx      # NEW
│   │   │   ├── StopWorkButton.tsx   # NEW
│   │   │   └── WeatherWidget.tsx    # NEW
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RiskChart.tsx        # NEW
│   │   │   ├── ActivityFeed.tsx     # NEW
│   │   │   ├── RecentTRAs.tsx       # NEW
│   │   │   ├── UpcomingLMRAs.tsx    # NEW
│   │   │   └── ComplianceWidget.tsx # NEW
│   │   │
│   │   ├── projects/                # Project components
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectTimeline.tsx
│   │   │   └── TeamAssignment.tsx
│   │   │
│   │   ├── reports/                 # Reporting components
│   │   │   ├── ReportBuilder.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── ExportButton.tsx
│   │   │
│   │   ├── comments/                # Collaboration components
│   │   │   ├── CommentThread.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── MentionInput.tsx
│   │   │
│   │   └── providers/               # Context providers
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       ├── NotificationProvider.tsx
│   │       └── OrganizationProvider.tsx
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── firebase.ts              # Firebase client SDK
│   │   ├── firebase-admin.ts        # Firebase Admin SDK
│   │   │
│   │   ├── api/                     # API utilities
│   │   │   ├── client.ts            # API client
│   │   │   ├── auth.ts              # Auth utilities
│   │   │   ├── errors.ts            # Error handling
│   │   │   ├── permissions.ts       # Permission checks
│   │   │   └── rate-limit.ts        # Rate limiting
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrganization.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useTRAs.ts
│   │   │   ├── useLMRA.ts
│   │   │   ├── useProjects.ts
│   │   │   ├── useUsers.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useCamera.ts
│   │   │   └── useOfflineSync.ts
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── date.ts              # Date formatting
│   │   │   ├── format.ts            # Data formatting
│   │   │   ├── validation.ts        # Input validation
│   │   │   ├── calculations.ts      # Risk calculations
│   │   │   └── file.ts              # File handling
│   │   │
│   │   ├── constants/               # App constants
│   │   │   ├── routes.ts
│   │   │   ├── roles.ts
│   │   │   ├── risk-levels.ts
│   │   │   └── competencies.ts
│   │   │
│   │   └── types/                   # TypeScript types
│   │       ├── index.ts             # Barrel exports
│   │       ├── auth.ts
│   │       ├── tra.ts
│   │       ├── lmra.ts
│   │       ├── project.ts
│   │       ├── user.ts
│   │       └── api.ts
│   │
│   ├── styles/                      # Global styles
│   │   └── globals.css
│   │
│   └── middleware.ts                # Next.js middleware (auth)
│
├── tests/                           # Test files
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
│
├── .env.local                       # Local environment variables
├── .env.example                     # Example environment variables
├── next.config.ts                   # Next.js configuration
├── tailwind.config.cjs              # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies
```

---

## Component Hierarchy

### Component Organization Principles

```
┌─────────────────────────────────────────────────────────┐
│                    App Layout                            │
│  (Root layout with global providers)                    │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Marketing│     │  Auth   │     │Dashboard│
   │ Layout  │     │ Layout  │     │ Layout  │
   └─────────┘     └─────────┘     └─────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
              │   TRA     │       │   LMRA    │       │ Projects  │
              │  Features │       │  Features │       │  Features │
              └───────────┘       └───────────┘       └───────────┘
                    │                    │                    │
         ┌──────────┼──────────┐         │         ┌──────────┼──────────┐
         │          │          │         │         │          │          │
    ┌────▼───┐ ┌───▼────┐ ┌───▼────┐   │    ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
    │  List  │ │ Create │ │ Detail │   │    │  List  │ │ Create │ │ Detail │
    └────────┘ └────────┘ └────────┘   │    └────────┘ └────────┘ └────────┘
                                        │
                              ┌─────────┼─────────┐
                              │         │         │
                         ┌────▼───┐ ┌──▼───┐ ┌──▼────┐
                         │Execute │ │Photos│ │Checks │
                         └────────┘ └──────┘ └───────┘
```

### Component Layer Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Layer 1: Layouts                          │
│  Purpose: Page structure and navigation                       │
│  Examples: DashboardLayout, AuthLayout, MarketingLayout       │
└───────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────┐
│                  Layer 2: Feature Components                  │
│  Purpose: Feature-specific, business logic containers         │
│  Examples: TRAForm, LMRAExecutionFlow, ProjectTimeline        │
└───────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────┐
│                Layer 3: Composite Components                  │
│  Purpose: Complex, reusable component compositions            │
│  Examples: CommentThread, ApprovalWorkflow, DataTable         │
└───────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────┐
│                   Layer 4: UI Components                      │
│  Purpose: Basic, highly reusable UI elements                  │
│  Examples: Button, Card, Modal, Alert, FormField              │
└───────────────────────────────────────────────────────────────┘
```

---

## Component Catalog

### 1. Base UI Components (Layer 4)

#### Button Component
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

// Usage:
<Button variant="primary" size="md" loading={isSubmitting}>
  Save TRA
</Button>
```

**Status**: ✅ Implemented  
**Location**: [`components/ui/Button.tsx`](web/src/components/ui/Button.tsx:1)

---

#### Card Component
```typescript
// components/ui/Card.tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// Usage:
<Card title="Risk Assessment" headerAction={<EditButton />}>
  {content}
</Card>
```

**Status**: ✅ Implemented  
**Location**: [`components/ui/Card.tsx`](web/src/components/ui/Card.tsx:1)

---

#### Modal Component
```typescript
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// Usage:
<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Hazard">
  <HazardForm onSubmit={handleSubmit} />
</Modal>
```

**Status**: ✅ Implemented  
**Location**: [`components/ui/Modal.tsx`](web/src/components/ui/Modal.tsx:1)

---

#### Form Components

**FormField** - Form input with label, error, helper text
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}
```
**Status**: ✅ Implemented  
**Location**: [`components/ui/FormField.tsx`](web/src/components/ui/FormField.tsx:1)

**Select** - Dropdown selector (NEW)
```typescript
interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}
```
**Status**: 🔴 Not Implemented

**Checkbox** - Checkbox input (NEW)
```typescript
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}
```
**Status**: 🔴 Not Implemented

---

### 2. Layout Components (Layer 1)

#### DashboardLayout
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  showBreadcrumbs?: boolean;
}

// Features:
// - Sidebar navigation
// - User menu
// - Notifications
// - Breadcrumbs
// - Responsive mobile menu
```
**Status**: ✅ Implemented  
**Location**: [`components/layouts/DashboardLayout.tsx`](web/src/components/layouts/DashboardLayout.tsx:1)

---

#### Sidebar Navigation (NEW)
```typescript
interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  submenu?: NavItem[];
}

// Navigation Structure:
// - Dashboard
// - TRAs
//   - All TRAs
//   - Create TRA
//   - Templates
// - LMRA
//   - Execute LMRA
//   - History
// - Projects
// - Team
// - Reports
// - Settings
```
**Status**: 🔴 Not Implemented

---

### 3. Feature Components (Layer 2)

#### TRA Components

**TRAForm** - Multi-step TRA creation wizard
```typescript
interface TRAFormProps {
  traId?: string;              // For editing existing TRA
  templateId?: string;         // Start from template
  projectId: string;
  onSubmit: (data: TRAData) => Promise<void>;
  onSaveDraft?: (data: Partial<TRAData>) => Promise<void>;
}

// Steps:
// 1. Project & Template Selection
// 2. Task Breakdown
// 3. Hazard Identification
// 4. Risk Assessment (Kinney & Wiruth)
// 5. Control Measures
// 6. Review & Submit

// Features:
// - Auto-save every 10 seconds
// - Progress indicator
// - Step validation
// - Template integration
// - Hazard library search
```
**Status**: 🔴 Not Implemented

---

**RiskCalculator** - Kinney & Wiruth risk calculation (NEW)
```typescript
interface RiskCalculatorProps {
  hazard: Hazard;
  onCalculate: (riskScore: number, riskLevel: RiskLevel) => void;
}

// Kinney & Wiruth Formula: R = E × B × W
// - Effect (E): 1, 3, 7, 15, 40, 100
// - Exposure (B): 0.5, 1, 2, 3, 6, 10
// - Probability (W): 0.1, 0.2, 0.5, 1, 3, 6, 10

// Risk Levels:
// - R > 400: Very High (Red)
// - R 200-400: High (Orange)
// - R 70-200: Substantial (Yellow)
// - R 20-70: Possible (Blue)
// - R < 20: Low (Green)
```
**Status**: 🔴 Not Implemented

---

**HazardLibrary** - Searchable hazard database (NEW)
```typescript
interface HazardLibraryProps {
  category?: string;           // Filter by category
  onSelect: (hazard: Hazard) => void;
  selectedHazards?: string[];  // Already selected IDs
}

// Features:
// - Search by keyword (Dutch/English)
// - Filter by category (electrical, mechanical, etc.)
// - Display related hazards
// - Show typical risk scores
// - Display recommended controls
```
**Status**: 🔴 Not Implemented

---

#### LMRA Components

**LMRAExecutionFlow** - Mobile-optimized LMRA workflow
```typescript
interface LMRAExecutionFlowProps {
  traId: string;
  onComplete: (data: LMRAData) => Promise<void>;
}

// Steps:
// 1. TRA Selection & Overview
// 2. Location Verification (GPS)
// 3. Weather Conditions
// 4. Environmental Checks
// 5. Team Verification
// 6. Equipment Checks
// 7. Photo Documentation
// 8. Final Assessment

// Features:
// - Offline support
// - Photo capture
// - GPS location
// - Weather API integration
// - Stop-work authority
// - Digital signatures
```
**Status**: 🔴 Not Implemented

---

**PhotoCapture** - Camera integration for safety photos (NEW)
```typescript
interface PhotoCaptureProps {
  category: 'work_area' | 'equipment' | 'hazard' | 'team' | 'environmental';
  onCapture: (photo: Photo) => void;
  maxPhotos?: number;
}

// Features:
// - In-app camera access
// - Client-side compression
// - EXIF data (GPS, timestamp)
// - Photo annotations
// - Offline caching
```
**Status**: 🔴 Not Implemented

---

**StopWorkButton** - Emergency stop work trigger (NEW)
```typescript
interface StopWorkButtonProps {
  onStopWork: (reason: string) => Promise<void>;
}

// Features:
// - Prominent red button
// - Confirmation dialog
// - Reason input
// - Immediate supervisor notification
// - GPS + photo documentation
```
**Status**: 🔴 Not Implemented

---

#### Dashboard Components

**RiskChart** - Risk distribution visualization (NEW)
```typescript
interface RiskChartProps {
  data: RiskData[];
  type: 'line' | 'bar' | 'donut' | 'heatmap';
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

// Chart Types:
// - Line: Risk trend over time
// - Bar: TRA count by risk level
// - Donut: Risk distribution by category
// - Heatmap: Risk by project and time
```
**Status**: 🔴 Not Implemented

---

**ActivityFeed** - Real-time activity stream (NEW)
```typescript
interface ActivityFeedProps {
  orgId: string;
  filter?: 'all' | 'tra' | 'lmra' | 'team';
  limit?: number;
}

// Activities:
// - TRA created/approved
// - LMRA completed
// - Stop work triggered
// - User joined
// - Comments added
```
**Status**: 🔴 Not Implemented

---

### 4. Composite Components (Layer 3)

#### ApprovalWorkflow - TRA approval flow visualization (NEW)
```typescript
interface ApprovalWorkflowProps {
  workflow: ApprovalWorkflow;
  onApprove?: (stepId: string, signature: string) => Promise<void>;
  onReject?: (stepId: string, reason: string) => Promise<void>;
}

// Features:
// - Visual workflow steps
// - Current step indicator
// - Approver information
// - Digital signature capture
// - Comments/feedback
```
**Status**: 🔴 Not Implemented

---

#### CommentThread - Threaded comments on TRAs (NEW)
```typescript
interface CommentThreadProps {
  traId: string;
  attachedTo?: { type: string; id: string };
  currentUserId: string;
}

// Features:
// - Nested replies
// - @mentions with autocomplete
// - Resolve/unresolve
// - Real-time updates
// - Edit history
```
**Status**: 🔴 Not Implemented

---

#### DataTable - Advanced data table with sorting, filtering (NEW)
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
}

// Features:
// - Column sorting
// - Column filtering
// - Pagination
// - Row selection
// - Export to CSV/Excel
```
**Status**: 🔴 Not Implemented

---

## Component Patterns

### 1. Server vs Client Components

**Server Components (Default)**
```typescript
// app/tras/page.tsx - Server Component
import { getTRAs } from '@/lib/api/tras';

export default async function TRAsPage() {
  const tras = await getTRAs(); // Direct database query
  
  return <TRAList tras={tras} />; // Pass data to client
}
```

**Client Components (Interactive)**
```typescript
'use client'; // Directive required

import { useState } from 'react';

export function TRAForm() {
  const [formData, setFormData] = useState({});
  
  // Interactive form logic
}
```

**When to Use Client Components:**
- Form inputs and validation
- State management (useState, useReducer)
- Event handlers (onClick, onChange)
- Browser APIs (geolocation, camera)
- Real-time listeners (Firestore)
- Animations and transitions

---

### 2. Composition Pattern

**Good: Composition**
```typescript
// Flexible and reusable
<Card>
  <Card.Header>
    <h2>Title</h2>
    <Button>Edit</Button>
  </Card.Header>
  <Card.Body>
    {content}
  </Card.Body>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

**Avoid: Over-Props**
```typescript
// Too many props, hard to extend
<Card 
  title="Title"
  headerAction={<Button>Edit</Button>}
  body={content}
  footerActions={[<Button>Save</Button>]}
/>
```

---

### 3. Props Pattern

**Type-Safe Props**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant, loading, children, ...props }: ButtonProps) {
  return (
    <button 
      className={cn('btn', `btn-${variant}`, { 'btn-loading': loading })}
      disabled={loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

**Default Props with Destructuring**
```typescript
export function Card({ 
  variant = 'default',
  padding = 'md',
  children 
}: CardProps) {
  // ...
}
```

---

### 4. Children Pattern

**Flexible Children**
```typescript
interface ModalProps {
  children: React.ReactNode; // Any valid React child
}

// Usage:
<Modal>
  <p>Text</p>
  <Component />
  {condition && <Element />}
</Modal>
```

**Render Props Pattern**
```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: T, loading: boolean, error?: Error) => React.ReactNode;
}

// Usage:
<DataFetcher url="/api/tras">
  {(tras, loading, error) => (
    loading ? <Spinner /> : <TRAList tras={tras} />
  )}
</DataFetcher>
```

---

### 5. Compound Components Pattern

```typescript
// Card with sub-components
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="card-footer">{children}</div>;
};

// Usage:
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## State Management

### 1. Local State (useState)

```typescript
// Simple component state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
```

**When to Use:**
- UI state (modals, dropdowns, tabs)
- Form inputs
- Component-specific data

---

### 2. Complex State (useReducer)

```typescript
// Complex state logic
type Action = 
  | { type: 'ADD_STEP'; payload: TaskStep }
  | { type: 'REMOVE_STEP'; payload: string }
  | { type: 'UPDATE_STEP'; payload: { id: string; data: Partial<TaskStep> } };

function traReducer(state: TRAState, action: Action): TRAState {
  switch (action.type) {
    case 'ADD_STEP':
      return { ...state, steps: [...state.steps, action.payload] };
    case 'REMOVE_STEP':
      return { ...state, steps: state.steps.filter(s => s.id !== action.payload) };
    case 'UPDATE_STEP':
      return {
        ...state,
        steps: state.steps.map(s => 
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        )
      };
  }
}

const [traState, dispatch] = useReducer(traReducer, initialState);
```

**When to Use:**
- Complex state updates
- Multiple related state values
- State transitions with rules

---

### 3. Context for Global State

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to auth state
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        const orgData = await getOrganization(userData.orgId);
        setUser(userData);
        setOrganization(orgData);
      } else {
        setUser(null);
        setOrganization(null);
      }
      setLoading(false);
    });
  }, []);
  
  const value = { user, organization, loading, login, logout };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Global Contexts:**
- AuthContext (user, organization, permissions)
- ThemeContext (dark mode, colors)
- NotificationContext (toast notifications)
- OrganizationContext (org settings, limits)

---

### 4. Server State (Firestore Real-time)

```typescript
// Custom hook for real-time TRAs
export function useTRAs(projectId: string) {
  const [tras, setTRAs] = useState<TRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const { orgId } = useAuth();
    const q = query(
      collection(db, `organizations/${orgId}/tras`),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TRA[];
        setTRAs(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    
    return unsubscribe; // Cleanup on unmount
  }, [projectId, orgId]);
  
  return { tras, loading, error };
}
```

---

## Naming Conventions

### File Naming

**Components**: PascalCase with `.tsx` extension
```
Button.tsx
TRAForm.tsx
DashboardLayout.tsx
```

**Utilities**: camelCase with `.ts` extension
```
formatDate.ts
calculateRisk.ts
apiClient.ts
```

**Types**: camelCase with `.ts` extension
```
tra.ts
user.ts
api.ts
```

**Constants**: kebab-case with `.ts` extension
```
risk-levels.ts
competencies.ts
```

---

### Component Naming

**Prefix by Feature**
```
TRAForm
TRACard
TRAList
TRADetail

LMRAForm
LMRACard
LMRAExecutionFlow

ProjectForm
ProjectCard
ProjectTimeline
```

**Suffix by Type**
```
Button (component)
Modal (component)
Card (component)
FormField (component)

useAuth (hook)
useTRAs (hook)
usePermissions (hook)

formatDate (utility)
calculateRisk (utility)
```

---

### Variable Naming

**Boolean Variables**: Prefix with `is`, `has`, `can`, `should`
```typescript
const isLoading = true;
const hasPermission = checkPermission();
const canEdit = user.role === 'admin';
const shouldShowModal = error !== null;
```

**Functions**: Verb-first, camelCase
```typescript
function handleSubmit() {}
function calculateRisk() {}
function formatCurrency() {}
function validateEmail() {}
```

**Event Handlers**: Prefix with `handle`
```typescript
const handleClick = () => {};
const handleChange = (e) => {};
const handleSubmit = async (data) => {};
```

---

## File Organization

### Component File Structure

**Simple Component** (Single file)
```typescript
// components/ui/Button.tsx

import { cn } from '@/lib/utils';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant, children }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`)}>
      {children}
    </button>
  );
}
```

---

**Complex Component** (Folder structure)
```
components/forms/TRAForm/
├── TRAForm.tsx              # Main component
├── TaskStepForm.tsx         # Sub-component
├── HazardForm.tsx           # Sub-component
├── RiskCalculator.tsx       # Sub-component
├── types.ts                 # Local types
├── utils.ts                 # Local utilities
└── index.ts                 # Barrel export
```

```typescript
// components/forms/TRAForm/index.ts
export { TRAForm } from './TRAForm';
export { TaskStepForm } from './TaskStepForm';
export type { TRAFormProps, TaskStepFormProps } from './types';
```

---

### Import Organization

```typescript
// 1. External packages
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal aliases
import { Button } from '@/components/ui/Button';
import { useTRAs } from '@/lib/hooks/useTRAs';
import { calculateRisk } from '@/lib/utils/calculations';

// 3. Types
import type { TRA, RiskLevel } from '@/lib/types';

// 4. Relative imports (avoid when possible)
import { helper } from './helper';
```

---

## Testing Strategy

### Component Tests (Jest + React Testing Library)

```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button variant="primary" onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button variant="primary" loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

### Integration Tests (Cypress)

```typescript
// cypress/e2e/tra-creation.cy.ts
describe('TRA Creation Flow', () => {
  beforeEach(() => {
    cy.login('safety_manager@example.com');
  });
  
  it('creates a new TRA from template', () => {
    cy.visit('/tras/new');
    
    // Step 1: Select template
    cy.get('[data-testid="template-selector"]').click();
    cy.contains('Electrical Work').click();
    cy.contains('Next').click();
    
    // Step 2: Add task steps
    cy.get('[data-testid="task-step-input"]').type('Install circuit breaker');
    cy.contains('Add Step').click();
    
    // Step 3: Identify hazards
    cy.contains('Electrical shock').click();
    
    // Step 4: Calculate risk
    cy.get('[data-testid="effect-score"]').select('15');
    cy.get('[data-testid="exposure-score"]').select('3');
    cy.get('[data-testid="probability-score"]').select('1');
    cy.contains('Risk Score: 45').should('be.visible');
    
    // Submit
    cy.contains('Submit for Approval').click();
    cy.contains('TRA submitted successfully').should('be.visible');
  });
});
```

---

## Performance Guidelines

### 1. Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const ReportBuilder = dynamic(() => import('@/components/reports/ReportBuilder'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Disable SSR for client-only components
});
```

---

### 2. Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Expensive calculation
const filteredTRAs = useMemo(() => {
  return tras.filter(tra => tra.riskLevel === 'high');
}, [tras]);

// Stable callback reference
const handleSubmit = useCallback((data: FormData) => {
  // submit logic
}, [dependency]);
```

---

### 3. Virtual Lists

```typescript
// For large lists (100+ items)
import { FixedSizeList } from 'react-window';

function TRAList({ tras }: { tras: TRA[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={tras.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <TRACard tra={tras[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

### 4. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/photos/worksite.jpg"
  alt="Work site photo"
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  loading="lazy"
/>
```

---

## Next Steps

### Immediate Actions

1. **Create Missing UI Components**
   - [ ] Select dropdown
   - [ ] Checkbox
   - [ ] Radio button
   - [ ] Switch toggle
   - [ ] Tabs
   - [ ] Table
   - [ ] Pagination
   - [ ] Tooltip
   - [ ] Dropdown menu
   - [ ] Progress bar
   - [ ] Toast notifications

2. **Build Feature Components**
   - [ ] TRAForm (multi-step wizard)
   - [ ] RiskCalculator
   - [ ] HazardLibrary
   - [ ] LMRAExecutionFlow
   - [ ] PhotoCapture
   - [ ] ApprovalWorkflow
   - [ ] CommentThread

3. **Implement Layouts**
   - [ ] MarketingLayout
   - [ ] AuthLayout
   - [ ] Sidebar navigation
   - [ ] Mobile responsive header

4. **Create Custom Hooks**
   - [ ] useTRAs (real-time TRA data)
   - [ ] useLMRA (LMRA operations)
   - [ ] useProjects (project data)
   - [ ] useGeolocation (GPS)
   - [ ] useCamera (photo capture)
   - [ ] useOfflineSync (PWA sync)

5. **TypeScript Types**
   - [ ] Generate types from Firestore schema
   - [ ] API request/response types
   - [ ] Form data types
   - [ ] Component prop types

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Sep 29, 2025 | Solo Developer | Initial component architecture design |

---

**Document Status**: ✅ Foundation Architecture Complete  
**Next Task**: Implement missing UI components (Task 2.6)  
**Dependencies**: FEATURE_REQUIREMENTS.md (complete), FIRESTORE_DATA_MODEL.md (complete)