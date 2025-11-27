# SafeWork Pro - Developer Onboarding Guide

**Document Version**: 1.0  
**Last Updated**: October 31, 2025  
**Target Audience**: New developers joining the project  
**Estimated Onboarding Time**: 2-4 hours

---

## 📋 Table of Contents

1. [Welcome](#welcome)
2. [Project Overview](#project-overview)
3. [Quick Start](#quick-start)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Development Workflow](#development-workflow)
7. [Code Standards](#code-standards)
8. [Testing Guidelines](#testing-guidelines)
9. [Common Tasks](#common-tasks)
10. [Debugging Tips](#debugging-tips)
11. [Resources](#resources)

---

## 👋 Welcome

Welcome to the SafeWork Pro development team! This guide will help you get up and running quickly.

### What is SafeWork Pro?

SafeWork Pro is a Dutch B2B SaaS application for digital safety management in construction, industrial, and offshore sectors. We digitize Task Risk Analysis (TRA) and Last Minute Risk Analysis (LMRA) processes, replacing paper-based workflows with a modern, mobile-first solution.

### Project Goals

- **Digitize Safety Processes**: Replace paper TRAs and LMRAs with digital workflows
- **Improve Safety**: Real-time risk assessment and stop-work authority
- **Increase Efficiency**: Offline-first PWA for field workers
- **Ensure Compliance**: VCA 2017 v5.1 and ISO 45001 compliance

### Team Structure

- **Solo Developer**: Full-stack development
- **AI Assistant (Cline)**: Code generation, documentation
- **You**: Welcome to the team!

---

## 🎯 Project Overview

### Core Features

1. **TRA Management**
   - Template-based TRA creation
   - Risk assessment with Kinney & Wiruth calculator
   - Multi-step approval workflow
   - Digital signatures

2. **LMRA Execution**
   - 8-step mobile workflow
   - GPS verification
   - QR code scanning
   - Photo capture
   - Offline support

3. **Stop-Work Authority**
   - Emergency stop-work button
   - Real-time notifications
   - Supervisor acknowledgment
   - Offline queue with auto-sync

4. **Integrations**
   - Stripe (payments)
   - Resend (emails)
   - OpenWeather (weather data)
   - Firebase (backend)

### Current Status

- **Project Completion**: 76%
- **Weeks to MVP**: 6
- **Test Coverage**: 65% (target: 80%+)
- **Active Development**: Yes

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18+ installed
- **npm** v9+ installed
- **Git** installed
- **VS Code** (recommended) or your preferred IDE
- **GitHub** account with repository access

### 1. Clone and Install (10 minutes)

```bash
# Clone the repository
git clone git@github.com:jackdamnielzz/Safe-taks.git
cd Safe-taks

# Install web dependencies
cd web
npm install

# Install Firebase Functions dependencies
cd ../functions
npm install

# Return to root
cd ..
```

### 2. Environment Setup (15 minutes)

```bash
# Copy environment template
cp web/.env.local.example web/.env.local

# Edit with your values (ask team for credentials)
code web/.env.local
```

**Required Environment Variables**:
- Firebase configuration (8 variables)
- Stripe keys (test mode)
- Resend API key
- OpenWeather API key

See [06-DEPLOYMENT-GUIDE.md](06-DEPLOYMENT-GUIDE.md) for detailed setup.

### 3. Start Development Server (2 minutes)

```bash
# Navigate to web directory
cd web

# Start development server
npm run dev

# Open browser at http://localhost:3000
```

### 4. Verify Setup (5 minutes)

- [ ] Application loads without errors
- [ ] Can navigate to login page
- [ ] No console errors
- [ ] Hot reload works (edit a file and see changes)

### 5. Run Tests (5 minutes)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.test.ts
```

### 6. Explore Codebase (30 minutes)

Start with these key files:

1. **`web/src/app/page.tsx`** - Homepage
2. **`web/src/app/tras/page.tsx`** - TRA list page
3. **`web/src/components/tra/TRAWizard.tsx`** - TRA creation wizard
4. **`web/src/lib/firebase.ts`** - Firebase configuration
5. **`web/src/types/index.ts`** - TypeScript type definitions

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.4 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.1.13 | Styling |
| **Radix UI** | Latest | Accessible components |
| **React Hook Form** | Latest | Form management |
| **Zod** | Latest | Schema validation |

### Backend & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Firebase Firestore** | NoSQL database |
| **Firebase Auth** | Authentication |
| **Firebase Storage** | File storage |
| **Firebase Functions** | Serverless functions |
| **Vercel** | Hosting & CDN |

### Third-Party Services

| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing |
| **Resend** | Email delivery |
| **OpenWeather** | Weather data |
| **Sentry** | Error tracking |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Unit testing |
| **Cypress** | E2E testing |
| **Husky** | Git hooks |

---

## 📁 Project Structure

### Root Directory

```
tra001/
├── web/                    # Next.js application
├── functions/              # Firebase Functions
├── docs/                   # Additional documentation
├── project-docs/           # Master documentation (you are here)
├── memory-bank/            # AI context files
├── scripts/                # Deployment scripts
├── load-tests/             # Performance tests
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── package.json            # Root package.json
```

### Web Directory Structure

```
web/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/         # Auth-protected routes
│   │   ├── api/            # API routes
│   │   ├── tras/           # TRA pages
│   │   ├── lmras/          # LMRA pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── tra/            # TRA components
│   │   ├── lmra/           # LMRA components
│   │   ├── approvals/      # Approval components
│   │   └── ui/             # Reusable UI components
│   ├── lib/                # Utilities and services
│   │   ├── firebase.ts     # Firebase config
│   │   ├── stripe.ts       # Stripe config
│   │   ├── traService.ts   # TRA service
│   │   ├── lmraService.ts  # LMRA service
│   │   └── __tests__/      # Service tests
│   ├── types/              # TypeScript types
│   ├── hooks/              # Custom React hooks
│   ├── messages/           # i18n translations
│   └── styles/             # Global styles
├── public/                 # Static assets
├── cypress/                # E2E tests
├── __mocks__/              # Test mocks
└── package.json            # Dependencies
```

### Key Directories Explained

**`src/app/`**: Next.js 15 App Router pages
- Each folder is a route
- `page.tsx` files are pages
- `layout.tsx` files are layouts
- `(auth)/` folder groups auth-protected routes

**`src/components/`**: React components
- Organized by feature (tra, lmra, approvals)
- `ui/` contains reusable components
- Each component has its own folder with tests

**`src/lib/`**: Business logic and services
- Firebase services (traService, lmraService)
- Utility functions
- API clients
- `__tests__/` contains unit tests

**`src/types/`**: TypeScript type definitions
- `index.ts` - Main types (TRA, LMRA, User, etc.)
- Shared across the application

---

## 🔄 Development Workflow

### Daily Workflow

1. **Pull Latest Changes**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code
   - Write tests
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(tra): add risk calculator integration
fix(lmra): resolve GPS permission issue
docs(readme): update installation instructions
test(tra): add unit tests for TRA service
```

### Branch Strategy

- **`main`**: Production branch (protected)
- **`staging`**: Staging branch (protected)
- **`feature/*`**: Feature branches
- **`fix/*`**: Bug fix branches
- **`hotfix/*`**: Emergency fixes

### Code Review Process

1. **Create PR** with clear description
2. **Request Review** from team member
3. **Address Feedback** if any
4. **Merge** after approval
5. **Delete Branch** after merge

---

## 📝 Code Standards

### TypeScript

**Always use TypeScript**:
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
function getUser(id) {
  // ...
}
```

**Use strict mode** (already configured):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### React Components

**Use functional components with hooks**:
```typescript
// ✅ Good
export function TRAList() {
  const [tras, setTras] = useState<TRA[]>([]);
  
  useEffect(() => {
    loadTRAs();
  }, []);
  
  return <div>{/* ... */}</div>;
}

// ❌ Bad (class components)
export class TRAList extends React.Component {
  // ...
}
```

**Use TypeScript for props**:
```typescript
// ✅ Good
interface TRACardProps {
  tra: TRA;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TRACard({ tra, onEdit, onDelete }: TRACardProps) {
  // ...
}
```

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `TRAWizard.tsx`)
- Utilities: `camelCase.ts` (e.g., `traService.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

**Variables**:
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Variables: `camelCase` (e.g., `userName`)
- Components: `PascalCase` (e.g., `TRACard`)

**Functions**:
- Regular functions: `camelCase` (e.g., `getUserById`)
- React components: `PascalCase` (e.g., `TRAList`)
- Event handlers: `handle*` prefix (e.g., `handleSubmit`)

### Code Organization

**Group imports**:
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal components
import { TRACard } from '@/components/tra/TRACard';
import { Button } from '@/components/ui/button';

// 3. Services and utilities
import { getTRAs } from '@/lib/traService';
import { formatDate } from '@/lib/utils';

// 4. Types
import type { TRA } from '@/types';
```

**Keep functions small**:
```typescript
// ✅ Good - Single responsibility
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// ❌ Bad - Too many responsibilities
function validateUser(email, password, name, phone) {
  // 50 lines of validation logic
}
```

---

## 🧪 Testing Guidelines

### Test Structure

**Use AAA pattern** (Arrange, Act, Assert):
```typescript
describe('TRA Service', () => {
  it('should create a new TRA', async () => {
    // Arrange
    const traData = {
      title: 'Test TRA',
      description: 'Test description',
    };
    
    // Act
    const result = await createTRA(traData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBe('Test TRA');
  });
});
```

### Unit Tests

**Test business logic**:
```typescript
// traService.test.ts
import { calculateRiskScore } from './traService';

describe('calculateRiskScore', () => {
  it('should calculate risk score correctly', () => {
    const probability = 5;
    const exposure = 3;
    const consequence = 10;
    
    const score = calculateRiskScore(probability, exposure, consequence);
    
    expect(score).toBe(150); // 5 * 3 * 10
  });
  
  it('should handle zero values', () => {
    const score = calculateRiskScore(0, 0, 0);
    expect(score).toBe(0);
  });
});
```

### Component Tests

**Test user interactions**:
```typescript
// TRACard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TRACard } from './TRACard';

describe('TRACard', () => {
  const mockTRA = {
    id: '1',
    title: 'Test TRA',
    status: 'draft',
  };
  
  it('should render TRA title', () => {
    render(<TRACard tra={mockTRA} />);
    expect(screen.getByText('Test TRA')).toBeInTheDocument();
  });
  
  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<TRACard tra={mockTRA} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

### E2E Tests

**Test critical user flows**:
```typescript
// cypress/e2e/tra-creation.cy.ts
describe('TRA Creation', () => {
  beforeEach(() => {
    cy.login(); // Custom command
    cy.visit('/tras/new');
  });
  
  it('should create a new TRA', () => {
    cy.get('[data-testid="tra-title"]').type('New TRA');
    cy.get('[data-testid="tra-description"]').type('Description');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.url().should('include', '/tras');
    cy.contains('New TRA').should('be.visible');
  });
});
```

### Test Coverage

**Aim for 80%+ coverage**:
```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

**Focus on**:
- Business logic (services)
- Critical user flows
- Edge cases and error handling

---

## 🔧 Common Tasks

### 1. Adding a New Page

```bash
# Create page file
touch web/src/app/your-page/page.tsx

# Add page content
```

```typescript
// web/src/app/your-page/page.tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}
```

### 2. Creating a New Component

```bash
# Create component directory
mkdir web/src/components/your-component

# Create component files
touch web/src/components/your-component/YourComponent.tsx
touch web/src/components/your-component/YourComponent.test.tsx
```

```typescript
// YourComponent.tsx
interface YourComponentProps {
  title: string;
}

export function YourComponent({ title }: YourComponentProps) {
  return <div>{title}</div>;
}
```

### 3. Adding a New API Route

```bash
# Create API route
touch web/src/app/api/your-endpoint/route.ts
```

```typescript
// route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Adding a New Firestore Collection

```typescript
// 1. Define type
interface YourType {
  id: string;
  name: string;
  createdAt: Date;
}

// 2. Create service
export async function createYourType(data: Omit<YourType, 'id'>) {
  const docRef = await addDoc(collection(db, 'yourTypes'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// 3. Update Firestore rules
// firestore.rules
match /yourTypes/{typeId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

### 5. Adding a New Environment Variable

```bash
# 1. Add to .env.local
echo "NEW_VARIABLE=value" >> web/.env.local

# 2. Add to Vercel (for deployment)
# Go to Vercel Dashboard → Settings → Environment Variables

# 3. Use in code
const value = process.env.NEW_VARIABLE;
```

### 6. Running Database Migrations

```bash
# 1. Update Firestore rules
code firestore.rules

# 2. Deploy rules
firebase deploy --only firestore:rules

# 3. Update indexes if needed
code firestore.indexes.json
firebase deploy --only firestore:indexes
```

---

## 🐛 Debugging Tips

### Browser DevTools

**React DevTools**:
- Install React DevTools extension
- Inspect component props and state
- Profile component performance

**Network Tab**:
- Monitor API requests
- Check request/response payloads
- Identify slow requests

**Console**:
- Use `console.log()` for quick debugging
- Use `console.table()` for arrays/objects
- Use `debugger;` for breakpoints

### VS Code Debugging

**Launch configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Common Issues

**Issue**: "Module not found"
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: "Firebase: Error (auth/configuration-not-found)"
```bash
# Solution: Check environment variables
cat web/.env.local | grep FIREBASE
```

**Issue**: TypeScript errors after pulling
```bash
# Solution: Restart TypeScript server
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Issue**: Tests failing locally
```bash
# Solution: Clear Jest cache
npm test -- --clearCache
npm test
```

---

## 📚 Resources

### Documentation

- **Project Docs**: `/project-docs/` directory
  - [01-EXECUTIVE-SUMMARY.md](01-EXECUTIVE-SUMMARY.md) - Project overview
  - [02-CURRENT-STATE.md](02-CURRENT-STATE.md) - Feature status
  - [03-ARCHITECTURE.md](03-ARCHITECTURE.md) - Technical architecture
  - [04-IMPLEMENTATION-STATUS.md](04-IMPLEMENTATION-STATUS.md) - Feature matrix
  - [05-ROADMAP.md](05-ROADMAP.md) - Development roadmap
  - [06-DEPLOYMENT-GUIDE.md](06-DEPLOYMENT-GUIDE.md) - Deployment procedures

- **Additional Docs**: `/docs/` directory
  - Backend guides
  - Testing guides
  - User guides

### External Resources

**Next.js**:
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

**React**:
- [React Documentation](https://react.dev)
- [React Hooks](https://react.dev/reference/react)
- [React Testing Library](https://testing-library.com/react)

**TypeScript**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Cheat Sheet](https://www.typescriptlang.org/cheatsheets)

**Firebase**:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)

**Tailwind CSS**:
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com)

### Tools

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Firebase
  - GitLens

- **Browser Extensions**:
  - React DevTools
  - Redux DevTools (if using Redux)
  - Lighthouse

### Getting Help

1. **Check Documentation**: Start with project docs
2. **Search Codebase**: Use VS Code search (Cmd+Shift+F)
3. **Ask Team**: Reach out on Slack/Teams
4. **Check Git History**: `git log` and `git blame`
5. **Stack Overflow**: For general questions

---

## ✅ Onboarding Checklist

### Day 1: Setup

- [ ] Clone repository
- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Start development server
- [ ] Run tests successfully
- [ ] Explore codebase

### Day 2: Understanding

- [ ] Read project documentation
- [ ] Understand tech stack
- [ ] Review project structure
- [ ] Understand development workflow
- [ ] Review code standards

### Day 3: First Contribution

- [ ] Pick a small task (good first issue)
- [ ] Create feature branch
- [ ] Make changes
- [ ] Write tests
- [ ] Create pull request

### Week 1: Integration

- [ ] Complete first PR
- [ ] Understand TRA workflow
- [ ] Understand LMRA workflow
- [ ] Understand approval workflow
- [ ] Understand stop-work feature

### Week 2: Productivity

- [ ] Work on medium-sized tasks
- [ ] Review others' PRs
- [ ] Contribute to documentation
- [ ] Help with testing
- [ ] Participate in planning

---

## 🎓 Learning Path

### Beginner (Week 1-2)

1. **Setup and Basics**
   - Complete onboarding checklist
   - Understand project structure
   - Make first contribution

2. **Core Concepts**
   - Learn Next.js App Router
   - Understand Firebase integration
   - Learn TypeScript basics

### Intermediate (Week 3-4)

1. **Feature Development**
   - Work on TRA features
   - Work on LMRA features
   - Implement UI components

2. **Testing**
   - Write unit tests
   - Write component tests
   - Understand E2E tests

### Advanced (Month 2+)

1. **Architecture**
   - Understand system design
   - Learn performance optimization
   - Contribute to architecture decisions

2. **Leadership**
   - Review PRs
   - Mentor new developers
   - Lead feature development

---

## 🤝 Contributing

### Pull Request Process

1. **Create PR** with clear title and description
2. **Link Issue** if applicable
3. **Add Screenshots** for UI changes
4. **Request Review** from team member
5. **Address Feedback** promptly
6. **Merge** after approval

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

---

## 📞 Contact

### Team Communication

- **Slack/Teams**: #safework-pro-dev
- **Email**: dev@safeworkpro.nl
- **GitHub**: @jackdamnielzz

### Support

- **Technical Issues**: Create GitHub issue
- **Questions**: Ask in team chat
- **Urgent**: Contact team lead directly

---

**Welcome aboard! We're excited to have you on the team! 🚀**

---

**Document Status**: ✅ Complete  
**Last Updated**: October 31, 2025  
**Next Review**: Quarterly or when onboarding new developers  
**Owner**: Development Team
