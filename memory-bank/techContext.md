# Tech Context - Technologie Stack & Setup

**Laatst Bijgewerkt**: 21 oktober 2025, 21:18 (Europe/Amsterdam)

## 🛠️ Technology Stack

### Frontend
```typescript
{
  framework: "Next.js 15.5.4",
  runtime: "React 19.1.0",
  language: "TypeScript 5.x (strict mode)",
  styling: "Tailwind CSS 4.1.13",
  stateManagement: "React Context + Hooks",
  forms: "React Hook Form + Zod validation",
  testing: "Jest + React Testing Library + Cypress"
}
```

### Backend & Infrastructure
```typescript
{
  hosting: "Vercel (Edge Network)",
  database: "Firebase Firestore",
  authentication: "Firebase Auth",
  storage: "Firebase Storage",
  functions: "Firebase Cloud Functions",
  monitoring: "Sentry + Vercel Analytics + Firebase Performance"
}
```

### Third-Party Services
```typescript
{
  payments: "Stripe (€49-€499/month tiers)",
  email: "Resend (transactional emails)",
  weather: "OpenWeather API (LMRA integration)",
  rateLimiting: "Upstash Redis",
  analytics: "Firebase Analytics + Google Analytics"
}
```

## 📦 Key Dependencies

### Production Dependencies (web/package.json)
```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "firebase": "^11.2.0",
  "firebase-admin": "^13.5.0",
  "@stripe/stripe-js": "^4.13.0",
  "recharts": "^2.15.0",        // Charts & visualizations
  "jspdf": "^2.5.2",            // PDF generation
  "jspdf-autotable": "^3.8.4",  // PDF tables
  "xlsx": "^0.18.5",            // Excel export
  "zod": "^3.24.1",             // Schema validation
  "uuid": "^11.0.5",            // Unique IDs
  "date-fns": "^4.1.0",         // Date utilities
  "react-hook-form": "^7.54.2"  // Form management
}
```

### Development Dependencies
```json
{
  "@types/node": "^22.13.12",
  "@types/react": "^19.1.0",
  "@types/uuid": "^11.0.0",
  "typescript": "^5.7.3",
  "@next/bundle-analyzer": "^15.5.4",
  "eslint": "^9",
  "prettier": "^3.4.2",
  "jest": "^29.7.0",
  "cypress": "^13.16.2",
  "husky": "^9.1.7"
}
```

## 🚀 Development Environment Setup

### Vereiste Software
```bash
# Node.js & npm
Node.js: v20.x of hoger (LTS recommended)
npm: v10.x of hoger

# Firebase CLI
npm install -g firebase-tools

# Vercel CLI
npm install -g vercel

# Optional maar aanbevolen
Git: Latest version
VS Code: Latest version met extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
```

### Eerste Setup
```bash
# 1. Clone repository
git clone git@github.com:jackdamnielzz/Safe-taks.git
cd tra001

# 2. Install dependencies
cd web
npm install --legacy-peer-deps

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local met je credentials

# 4. Start Firebase emulator (optioneel)
firebase emulators:start

# 5. Start development server
npm run dev
# App draait op http://localhost:3000
```

## 🔑 Environment Variables

### Development (.env.local)
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hale-ripsaw-403915.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hale-ripsaw-403915
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hale-ripsaw-403915.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Firebase Admin (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# External APIs
NEXT_PUBLIC_OPENWEATHER_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Production (Vercel Environment Variables)
Zelfde variabelen maar met production values:
- Firebase production project credentials
- Stripe live mode keys
- Production Sentry DSN
- Production domain URL

## 🏗️ Project Structure

```
tra001/
├── memory-bank/              # Memory Bank (context voor Cline)
│   ├── productContext.md
│   ├── activeContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   └── progress.md
│
├── web/                      # Next.js applicatie
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (auth)/      # Auth routes
│   │   │   ├── admin/       # Admin interface
│   │   │   ├── api/         # API routes
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   └── ...
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & services
│   │   │   ├── firebase.ts
│   │   │   ├── firebase-admin.ts
│   │   │   ├── cache/       # Caching layer
│   │   │   ├── services/    # Business logic
│   │   │   ├── validators/  # Zod schemas
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   └── __tests__/       # Test files
│   ├── public/              # Static assets
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.cjs
│   └── tsconfig.json
│
├── functions/               # Firebase Functions
│   ├── src/
│   │   ├── index.ts
│   │   └── thumbnailGenerator.ts
│   └── package.json
│
├── load-tests/              # Load testing
│   ├── artillery/           # Artillery configs
│   ├── k6/                  # k6 scripts
│   └── scripts/             # Helper scripts
│
├── docs/                    # Documentation
│   ├── admin/
│   ├── analytics/
│   ├── backend/
│   ├── deployment/
│   ├── gebruikers/
│   ├── runbooks/
│   └── testing/
│
├── scripts/                 # Deployment scripts
│   ├── deploy-production.sh
│   ├── deploy-preview.sh
│   └── ...
│
├── firebase.json            # Firebase config
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Database indexes
├── vercel.json              # Vercel config
├── package.json             # Root dependencies
└── README.md
```

## 🔧 Build & Deploy

### Local Development
```bash
# Development server (hot reload)
npm run dev

# Build for production (test local)
npm run build

# Start production build locally
npm start

# Bundle analysis
npm run build:analyze
```

### Testing
```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (Cypress)
npm run cypress:open

# Firebase emulator tests
npm run test:emulated

# All tests
npm run test:all
```

### Linting & Formatting
```bash
# ESLint check
npm run lint

# ESLint fix
npm run lint:fix

# Prettier format
npm run format

# Pre-commit hook (automatic via Husky)
# Runs lint + format on staged files
```

### Deployment
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy:production

# Vercel CLI
vercel --prod
```

## 🔥 Firebase Configuration

### Firebase Project
```
Project ID: hale-ripsaw-403915
Region: europe-west (Belgium)
```

### Services Gebruikt
```typescript
{
  Firestore: {
    mode: "Native",
    region: "europe-west",
    indexes: 11,  // Deployed
    rules: "Multi-tenant + RBAC"
  },
  Authentication: {
    providers: ["Email/Password", "Google"],
    customClaims: ["orgId", "role"]
  },
  Storage: {
    buckets: ["default", "uploads"],
    rules: "Role-based + file type validation"
  },
  Functions: {
    runtime: "Node.js 20",
    functions: ["thumbnailGenerator"]
  },
  Analytics: {
    events: 20+,
    customDimensions: 10+
  },
  Performance: {
    traces: 13,
    webVitals: true
  }
}
```

### Firestore Indexes (11 deployed)
```javascript
// TRA Collection (6 indexes)
- status + createdAt
- projectId + createdAt
- templateId + createdAt
- createdBy + createdAt
- overallRiskLevel + createdAt
- validFrom + validUntil

// Template Collection (2 indexes)
- industryCategory + isActive + status + createdAt
- complianceFramework + language + createdAt

// Audit Logs (3 indexes)
- timestamp + eventType + category
- actorId + timestamp
- projectId + timestamp
```

## 🚀 Vercel Configuration

### Build Settings
```json
{
  "framework": "nextjs",
  "buildCommand": "cd web && npm run build",
  "outputDirectory": "web/.next",
  "installCommand": "npm install --legacy-peer-deps --force",
  "devCommand": "cd web && npm run dev"
}
```

### Environment Variables (Vercel Dashboard)
- Alle environment variables uit .env.local
- Production values voor Firebase, Stripe, etc.
- FIREBASE_SERVICE_ACCOUNT_KEY voor server-side operaties

### Performance Budgets
```json
{
  "bundleSize": "250kb (gzipped)",
  "pageLoad": "2000ms",
  "apiResponse": "500ms (P95)",
  "LCP": "2500ms",
  "FID": "100ms",
  "CLS": "0.1"
}
```

## 🧪 Testing Infrastructure

### Jest Configuration
```javascript
// jest.config.js
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65
    }
  }
}
```

### Cypress Configuration
```typescript
// cypress.config.ts
{
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Firebase emulator setup
    }
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true
}
```

## 🔍 Development Tools

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "firebase.vscode",
    "ms-azuretools.vscode-docker",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Browser DevTools
- React Developer Tools
- Redux DevTools (optional)
- Lighthouse (performance audits)
- Firebase Emulator Suite UI

## 🐛 Debugging

### Next.js Debugging
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Node.js inspector
NODE_OPTIONS='--inspect' npm run dev
# Chrome: chrome://inspect
```

### Firebase Emulator Debugging
```bash
# Start emulators with UI
firebase emulators:start

# Emulator UI: http://localhost:4000
# Firestore: http://localhost:8080
# Auth: http://localhost:9099
```

### Network Debugging
```bash
# Sentry breadcrumbs (development)
# Check browser console voor detailed traces

# Vercel deployment logs
vercel logs --follow

# Firebase functions logs
firebase functions:log
```

## 📚 Belangrijke Commands Cheatsheet

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run build:analyze    # Build met bundle analysis

# Testing
npm test                 # Run unit tests
npm run test:coverage    # Tests met coverage
npm run cypress:open     # E2E tests

# Code Quality
npm run lint             # Check linting
npm run format           # Format code
npm run type-check       # TypeScript check

# Firebase
firebase emulators:start          # Start emulators
firebase deploy --only firestore  # Deploy rules
firebase deploy --only functions  # Deploy functions

# Vercel
vercel                   # Deploy preview
vercel --prod            # Deploy production
vercel env pull          # Pull env variables
vercel logs              # View logs
```

## 🔒 Security Considerations

### API Keys
- **Client-side**: NEXT_PUBLIC_* keys zijn veilig in browser
- **Server-side**: Gebruik server-only keys (geen NEXT_PUBLIC prefix)
- **Firebase Admin**: Alleen in server context gebruiken

### Environment Isolation
- Development: `.env.local` (gitignored)
- Staging: Vercel preview environment
- Production: Vercel production environment

### Secret Management
- Vercel: Encrypted environment variables
- Firebase: Google Cloud Secret Manager (optional)
- Nooit secrets in code committen

## 💡 Performance Tips

### Development
```bash
# Faster rebuilds
npm run dev -- --turbo

# Skip type checking during dev (faster)
# Set in next.config.ts: typescript.ignoreBuildErrors

# Reduce bundle size in analysis
ANALYZE=true npm run build
```

### Production
```typescript
// next.config.ts optimizations
{
  swcMinify: true,              // Fast minification
  compress: true,                // Gzip compression
  poweredByHeader: false,        // Remove X-Powered-By
  generateEtags: true,           // ETag caching
  reactStrictMode: true          // React best practices
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Future)
```yaml
# Potential workflow
- Lint & Type Check
- Run Unit Tests
- Run E2E Tests
- Build Production
- Deploy to Vercel
- Run Lighthouse Audit
```

### Current Workflow
- Husky pre-commit: Lint + Format
- Push to GitHub: Automatic Vercel deploy
- Manual testing: Before production merge
