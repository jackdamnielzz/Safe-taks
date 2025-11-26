# SafeWork Pro - TRA/LMRA B2B SaaS Platform

**Modern, Progressive Web Application for Task Risk Analysis and Last Minute Risk Analysis**

SafeWork Pro is a comprehensive safety management platform built with Next.js 14, TypeScript, Firebase, and deployed on Vercel. The platform enables organizations to conduct digital risk assessments, manage safety workflows, and ensure compliance with safety regulations.

## 🚀 Quick Start

### For Developers
```bash
# Clone the repository
git clone <repository-url>
cd tra001

# Install dependencies
npm install
cd web && npm install

# Set up environment variables
cp web/.env.local.example web/.env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

Visit [Developer Onboarding Guide](project-docs/07-DEVELOPER-ONBOARDING.md) for detailed setup instructions.

### For Users
- **Production**: [https://safework-pro.vercel.app](https://safework-pro.vercel.app)
- **User Guides**: See `/docs/gebruikers/` directory

## 📚 Documentation

### Master Documentation (`/project-docs/`)
Comprehensive, consolidated documentation (8,300+ lines):

1. **[README](project-docs/README.md)** - Documentation navigation
2. **[Executive Summary](project-docs/01-EXECUTIVE-SUMMARY.md)** - Project overview, vision, and business context
3. **[Current State](project-docs/02-CURRENT-STATE.md)** - What's built, what works, current capabilities
4. **[Architecture](project-docs/03-ARCHITECTURE.md)** - Technical architecture, stack, and design decisions
5. **[Implementation Status](project-docs/04-IMPLEMENTATION-STATUS.md)** - Detailed feature status and completion tracking
6. **[Roadmap](project-docs/05-ROADMAP.md)** - Future plans, phases, and development timeline
7. **[Deployment Guide](project-docs/06-DEPLOYMENT-GUIDE.md)** - Production deployment, monitoring, and operations
8. **[Developer Onboarding](project-docs/07-DEVELOPER-ONBOARDING.md)** - Getting started, development workflow, and best practices

### Specialized Documentation (`/docs/`)
- **Admin Guides** - Organization management, user administration, data operations
- **User Guides** - Role-specific handbooks (Admin, Safety Manager, Supervisor, Field Worker)
- **Backend Documentation** - API endpoints, Firebase admin, database management
- **Deployment Runbooks** - Incident response, troubleshooting, monitoring
- **Testing Guides** - Unit testing, E2E testing, Firebase emulator testing

### Historical Documentation (`/docs-archive/`)
Archived documentation from project evolution. See [Archive Index](docs-archive/README.md).

## 🏗️ Project Structure

```
tra001/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # React components
│   │   ├── lib/                  # Utilities and services
│   │   └── messages/             # i18n translations
│   ├── public/                   # Static assets
│   └── cypress/                  # E2E tests
├── functions/                    # Firebase Cloud Functions
├── docs/                         # Specialized documentation
├── project-docs/                 # Master documentation
├── docs-archive/                 # Historical documentation
├── scripts/                      # Deployment and utility scripts
├── memory-bank/                  # Cline's memory bank
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
└── vercel.json                  # Vercel configuration
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Deployment**: Vercel (Edge Network)
- **Payments**: Stripe
- **Email**: Resend
- **Testing**: Jest, React Testing Library, Cypress
- **PWA**: next-pwa with offline support

## ✨ Key Features

### Core Functionality
- ✅ **Digital LMRA Forms** - Multi-step wizard with offline support
- ✅ **Photo Documentation** - Camera integration with compression
- ✅ **Digital Signatures** - Canvas-based signature capture
- ✅ **Weather Integration** - Real-time weather data (OpenWeatherMap)
- ✅ **Stop Work Authority** - Emergency work stoppage workflow
- ✅ **Offline Sync** - Full offline capability with background sync

### Business Features
- ✅ **Multi-tenant Architecture** - Organization-based isolation
- ✅ **Role-based Access Control** - 4 user roles with granular permissions
- ✅ **Approval Workflows** - Multi-level approval system
- ✅ **Email Notifications** - Automated notifications via Resend
- ✅ **Subscription Management** - Stripe integration (Free/Pro/Enterprise)
- ✅ **Dutch Localization** - Full i18n support

### Technical Features
- ✅ **Progressive Web App** - Installable, offline-first
- ✅ **Real-time Updates** - Firestore real-time listeners
- ✅ **Optimistic UI** - Instant feedback with background sync
- ✅ **Security Rules** - Comprehensive Firestore security
- ✅ **Performance Optimized** - Code splitting, lazy loading, image optimization

## 🆕 Recent Features

### TRA Context Fields (v1.3)
Enhanced TRA's with materials tracking and workplace conditions documentation.

**Key capabilities:**
- Track materials with hazard and MSDS flagging
- Document 7 workplace condition types
- Auto-suggest hazards based on materials/conditions
- VCA compliance scoring bonuses
- LMRA equipment check integration

**Documentation:**
- [Feature Guide](docs/features/tra-context-fields.md)
- [API Reference](docs/api/tra-context-fields-api.md)

**Tests:** 71 passing (21 validation + 23 UI + 27 integration)

## 🔐 Security & Compliance

- **Authentication**: Firebase Auth with email/password and Google OAuth
- **Authorization**: Row-level security via Firestore rules
- **Data Privacy**: GDPR-compliant data handling
- **Encryption**: TLS in transit, encrypted at rest (Firebase)
- **Audit Logging**: Comprehensive activity tracking

## 📊 Current Status

**Phase**: Production-Ready MVP  
**Version**: 1.0  
**Last Updated**: October 2025

### Completion Status
- ✅ Core LMRA functionality (100%)
- ✅ User management (100%)
- ✅ Offline support (100%)
- ✅ Payment integration (100%)
- ✅ Email notifications (100%)
- ✅ Approval workflows (100%)
- 🚧 Analytics dashboard (Planned)
- 🚧 Mobile apps (Planned)
- 🚧 ERP integrations (Planned)

See [Implementation Status](project-docs/04-IMPLEMENTATION-STATUS.md) for detailed breakdown.

## 🚀 Deployment

### Production
```bash
# Deploy to Vercel
npm run deploy:production

# Deploy Firebase rules
firebase deploy --only firestore:rules,storage:rules
```

### Preview
```bash
# Deploy preview environment
npm run deploy:preview
```

See [Deployment Guide](project-docs/06-DEPLOYMENT-GUIDE.md) for complete instructions.

## 🧪 Testing

```bash
# Run unit tests
cd web && npm test

# Run E2E tests
cd web && npm run cypress:open

# Run with Firebase emulator
npm run test:emulator
```

## 📈 Monitoring & Operations

- **Uptime**: Vercel Analytics
- **Errors**: Sentry (configured)
- **Performance**: Firebase Performance Monitoring
- **Logs**: Vercel Logs + Firebase Logs

See [Deployment Guide - Monitoring](project-docs/06-DEPLOYMENT-GUIDE.md#monitoring-and-alerting) for details.

## 🤝 Contributing

1. Read [Developer Onboarding](project-docs/07-DEVELOPER-ONBOARDING.md)
2. Follow the development workflow
3. Write tests for new features
4. Update documentation
5. Submit pull request

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

- **Documentation**: Start with [project-docs/README.md](project-docs/README.md)
- **Issues**: Use GitHub Issues
- **Questions**: Contact development team

## 🗺️ Roadmap

See [Roadmap](project-docs/05-ROADMAP.md) for:
- Phase 2: Analytics & Reporting (Q1 2026)
- Phase 3: Mobile Apps (Q2 2026)
- Phase 4: Advanced Integrations (Q3 2026)
- Phase 5: AI/ML Features (Q4 2026)

---

**Built with ❤️ for workplace safety**
