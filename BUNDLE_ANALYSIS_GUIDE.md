# Bundle Analysis and Performance Monitoring Guide

**Last Updated**: October 3, 2025  
**Project**: SafeWork Pro - TRA/LMRA Web Application  
**Purpose**: Comprehensive guide for bundle size analysis and performance optimization

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Bundle Analyzer Setup](#bundle-analyzer-setup)
4. [Running Bundle Analysis](#running-bundle-analysis)
5. [Understanding the Reports](#understanding-the-reports)
6. [Performance Budgets](#performance-budgets)
7. [Optimization Strategies](#optimization-strategies)
8. [Tree-Shaking and Import Optimization](#tree-shaking-and-import-optimization)
9. [Monitoring and Alerts](#monitoring-and-alerts)
10. [Best Practices](#best-practices)

---

## Overview

Bundle analysis is critical for maintaining optimal performance in the SafeWork Pro application. This guide covers:

- **Bundle Size Tracking**: Monitor JavaScript bundle sizes against the 250kb target
- **Performance Monitoring**: Track Core Web Vitals and loading performance
- **Import Optimization**: Identify opportunities for tree-shaking and code splitting
- **Dependency Analysis**: Understand which packages contribute most to bundle size

### Why Bundle Analysis Matters

- **Mobile Performance**: Field workers often use mobile devices with limited bandwidth
- **Offline Capability**: Smaller bundles mean faster PWA installation and updates
- **User Experience**: Faster load times improve engagement and satisfaction
- **Cost Efficiency**: Reduced bandwidth usage for users on metered connections

---

## Quick Start

### Generate Bundle Analysis Report

```bash
# Navigate to web directory
cd web

# Run bundle analysis
npm run build:analyze
```

This will:
1. Build the production application
2. Generate interactive HTML reports
3. Open reports in your default browser

### View Reports

Reports are generated in `.next/analyze/`:
- **Client Bundle**: `.next/analyze/client.html` - Client-side JavaScript
- **Server Bundle**: `.next/analyze/server.html` - Server-side code

---

## Bundle Analyzer Setup

### Installation

The bundle analyzer is already installed and configured:

```json
{
  "devDependencies": {
    "@next/bundle-analyzer": "latest"
  }
}
```

### Configuration

Bundle analyzer is configured in [`next.config.ts`](web/next.config.ts:1):

```typescript
import withBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});
```

### Scripts

Available npm scripts in [`package.json`](web/package.json:1):

```json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build"
  }
}
```

---

## Running Bundle Analysis

### Standard Analysis

```bash
npm run build:analyze
```

### Windows PowerShell

```powershell
$env:ANALYZE="true"; npm run build
```

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Analyze Bundle Size
  run: |
    cd web
    npm run build:analyze
  env:
    ANALYZE: true
```

---

## Understanding the Reports

### Client Bundle Report

The client bundle report shows all JavaScript sent to the browser:

#### Key Metrics to Monitor

1. **Total Bundle Size** (Target: <250kb gzipped)
   - Main bundle
   - Vendor chunks
   - Dynamic imports

2. **Largest Dependencies**
   - Firebase SDK
   - React/Next.js
   - UI libraries (Recharts, React Joyride)
   - Form libraries (React Hook Form, Zod)

3. **Code Splitting Effectiveness**
   - Route-based chunks
   - Dynamic imports
   - Shared chunks

### Server Bundle Report

The server bundle shows server-side code:

1. **API Routes**
2. **Server Components**
3. **Middleware**
4. **Firebase Admin SDK**

### Reading the Visualization

- **Size**: Box size represents file size
- **Color**: Different colors for different modules
- **Hierarchy**: Nested boxes show module dependencies
- **Hover**: Shows exact sizes (stat, parsed, gzipped)

---

## Performance Budgets

### Current Budgets

Defined in [`performance-budgets.json`](web/performance-budgets.json:1):

```json
{
  "bundle_size": {
    "target": "250kb",
    "description": "JavaScript bundle size (gzipped)",
    "priority": "high"
  },
  "page_load": {
    "target": "2000ms",
    "priority": "critical"
  },
  "first_contentful_paint": {
    "target": "1800ms",
    "priority": "critical"
  },
  "largest_contentful_paint": {
    "target": "2500ms",
    "priority": "critical"
  }
}
```

### Budget Thresholds

- **Good**: All metrics meet or exceed targets
- **Needs Improvement**: 10-25% over target
- **Poor**: >25% over target (immediate action required)

### Feature-Specific Budgets

```json
{
  "tra_creation_form": {
    "target_load_time": "1500ms"
  },
  "lmra_mobile_execution": {
    "target_load_time": "1000ms"
  },
  "dashboard": {
    "target_load_time": "2000ms"
  }
}
```

---

## Optimization Strategies

### 1. Code Splitting

#### Route-Based Splitting

Next.js automatically splits code by route. Verify in bundle report:

```typescript
// Automatic route splitting
app/
  ├── page.tsx          // Home chunk
  ├── dashboard/
  │   └── page.tsx      // Dashboard chunk
  └── admin/
      └── page.tsx      // Admin chunk
```

#### Dynamic Imports

Use for heavy components:

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const BundleAnalyzer = dynamic(
  () => import('@/components/admin/BundleAnalyzer'),
  { ssr: false }
);

const ReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  { loading: () => <LoadingSpinner /> }
);
```

### 2. Tree-Shaking

#### Import Only What You Need

❌ **Bad**: Imports entire library

```typescript
import _ from 'lodash';
import * as Icons from 'react-icons/fa';
```

✅ **Good**: Imports specific functions

```typescript
import debounce from 'lodash/debounce';
import { FaUser, FaHome } from 'react-icons/fa';
```

#### Firebase Optimization

❌ **Bad**: Imports all Firebase

```typescript
import firebase from 'firebase/app';
```

✅ **Good**: Imports specific services

```typescript
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
```

### 3. Dependency Optimization

#### Analyze Large Dependencies

Check bundle report for:
- Recharts (charts library)
- React Joyride (product tour)
- jsPDF (PDF generation)
- xlsx (Excel export)

#### Consider Alternatives

| Current | Size | Alternative | Size | Notes |
|---------|------|-------------|------|-------|
| Recharts | ~150kb | Chart.js | ~60kb | Consider for simpler charts |
| jsPDF | ~200kb | Server-side | 0kb | Generate PDFs on server |
| xlsx | ~400kb | Server-side | 0kb | Generate Excel on server |

### 4. Image Optimization

Already implemented in [`imageOptimization.ts`](web/src/lib/imageOptimization.ts:1):

- WebP/AVIF format with fallbacks
- 40-60% compression
- Lazy loading with IntersectionObserver
- Responsive images with srcset

### 5. Font Optimization

```typescript
// next.config.ts
{
  optimizeFonts: true,
  fontDisplay: 'swap'
}
```

---

## Tree-Shaking and Import Optimization

### Identifying Opportunities

1. **Run Bundle Analysis**
   ```bash
   npm run build:analyze
   ```

2. **Look for Large Modules**
   - Hover over large boxes in the visualization
   - Check if entire library is imported
   - Identify unused code

3. **Check Import Statements**
   ```bash
   # Search for barrel imports
   grep -r "import \* as" src/
   grep -r "import .* from '[^/]*'$" src/
   ```

### Common Optimizations

#### Lodash

```typescript
// Before: 70kb
import _ from 'lodash';

// After: 5kb per function
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

#### Date Libraries

```typescript
// Before: date-fns entire library
import { format, parse, addDays } from 'date-fns';

// After: Individual imports
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import addDays from 'date-fns/addDays';
```

#### Icon Libraries

```typescript
// Before: All icons
import * as Icons from 'react-icons/fa';

// After: Specific icons
import { FaUser, FaHome, FaCog } from 'react-icons/fa';
```

### Webpack Bundle Analyzer Insights

Use the interactive report to:

1. **Identify Duplicates**
   - Same library imported multiple times
   - Different versions of same package

2. **Find Unused Code**
   - Large modules with low usage
   - Development-only code in production

3. **Optimize Chunks**
   - Shared code between routes
   - Vendor chunk optimization

---

## Monitoring and Alerts

### Vercel Speed Insights

Already integrated in [`layout.tsx`](web/src/app/layout.tsx:1):

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Core Web Vitals Tracking

Monitored metrics:
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

### Setting Up Alerts

#### 1. Vercel Dashboard

Configure in Vercel project settings:
- Performance budget alerts
- Core Web Vitals thresholds
- Email notifications

#### 2. GitHub Actions

Add to CI/CD workflow:

```yaml
- name: Check Bundle Size
  run: |
    cd web
    npm run build
    node scripts/check-bundle-size.js
```

#### 3. Lighthouse CI

Future enhancement (currently disabled):

```json
{
  "lighthouse_ci": {
    "enabled": false,
    "note": "To be implemented in CI/CD pipeline"
  }
}
```

---

## Best Practices

### 1. Regular Analysis

- **Weekly**: Run bundle analysis during development
- **Pre-Release**: Always analyze before major releases
- **Post-Deployment**: Monitor real-world performance

### 2. Code Review Checklist

Before merging PRs, verify:
- [ ] No unnecessary dependencies added
- [ ] Imports are optimized (no barrel imports)
- [ ] Heavy components use dynamic imports
- [ ] Images are optimized
- [ ] Bundle size increase is justified

### 3. Dependency Management

```bash
# Check dependency sizes before installing
npx bundle-phobia <package-name>

# Example
npx bundle-phobia recharts
```

### 4. Performance Testing

Test on real devices:
- **Mobile**: Test on 3G connection
- **Desktop**: Test on broadband
- **Offline**: Test PWA offline functionality

### 5. Documentation

Document all optimization decisions:
- Why a library was chosen
- Trade-offs considered
- Performance impact measured

---

## Troubleshooting

### Bundle Size Increased Unexpectedly

1. **Compare Reports**
   ```bash
   # Generate baseline
   npm run build:analyze
   
   # After changes
   npm run build:analyze
   ```

2. **Check Git Diff**
   ```bash
   git diff HEAD~1 package.json
   ```

3. **Analyze New Dependencies**
   ```bash
   npm ls <package-name>
   ```

### Analysis Not Running

1. **Check Environment Variable**
   ```bash
   echo $ANALYZE  # Should be 'true'
   ```

2. **Verify Installation**
   ```bash
   npm ls @next/bundle-analyzer
   ```

3. **Clear Cache**
   ```bash
   rm -rf .next
   npm run build:analyze
   ```

### Reports Not Opening

1. **Manual Open**
   ```bash
   open .next/analyze/client.html
   ```

2. **Check File Permissions**
   ```bash
   ls -la .next/analyze/
   ```

---

## Integration with Existing Tools

### Sentry Performance Monitoring

Already configured in [`instrumentation.ts`](web/src/instrumentation.ts:1):

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

### Firebase Performance

Can be added for additional monitoring:

```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

---

## Next Steps

### Immediate Actions

1. **Run Initial Analysis**
   ```bash
   npm run build:analyze
   ```

2. **Document Baseline**
   - Record current bundle sizes
   - Note largest dependencies
   - Identify optimization opportunities

3. **Set Up Monitoring**
   - Configure Vercel alerts
   - Add CI/CD checks
   - Schedule regular reviews

### Future Enhancements

1. **Lighthouse CI Integration**
   - Automated performance testing
   - Historical tracking
   - PR comments with metrics

2. **Bundle Size Tracking**
   - Track size over time
   - Visualize trends
   - Alert on regressions

3. **Advanced Optimizations**
   - Server-side PDF generation
   - Server-side Excel generation
   - CDN optimization for static assets

---

## Resources

### Documentation

- [Next.js Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Web.dev Performance](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

### Tools

- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [WebPageTest](https://www.webpagetest.org/) - Real-world testing

### Internal Documentation

- [`performance-budgets.json`](web/performance-budgets.json:1) - Performance targets
- [`next.config.ts`](web/next.config.ts:1) - Build configuration
- [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md:1) - Testing approach
- [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1) - Project context

---

## Support

For questions or issues:
1. Check this guide first
2. Review bundle analysis reports
3. Consult team documentation
4. Create GitHub issue if needed

---

**End of Guide** - Keep bundle sizes optimized for the best user experience!