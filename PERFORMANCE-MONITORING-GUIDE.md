# Performance Monitoring & Optimization Guide

**Last Updated**: 2025-11-09 22:41 CET
**Status**: Ready for execution
**Estimated Time**: 4-5 hours
**Priority**: HIGH (Required for production launch)

---

## Overview

This guide covers setting up comprehensive performance monitoring, establishing baselines, identifying bottlenecks, and implementing optimizations for SafeWork Pro.

---

## Part 1: Performance Monitoring Setup (1.5 hours)

### 1.1 Vercel Analytics Setup (15 minutes)

**Step 1: Enable Vercel Analytics**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select SafeWork Pro project
3. Navigate to **Analytics** tab
4. Click **Enable Analytics**
5. Choose plan:
   - **Hobby**: Free (100k requests/month)
   - **Pro**: $20/month (1M requests/month)
   - **Enterprise**: Custom pricing

**Step 2: Add Analytics to Application**

Already configured in [`web/package.json`](web/package.json:1):
```json
{
  "dependencies": {
    "@vercel/analytics": "^1.x.x"
  }
}
```

Verify integration in [`web/src/app/layout.tsx`](web/src/app/layout.tsx:1):
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Step 3: Verify Data Collection**

1. Deploy to production
2. Wait 5-10 minutes for data collection
3. Check Vercel Analytics dashboard
4. Verify metrics are being collected:
   - Page views
   - Unique visitors
   - Top pages
   - Top referrers
   - Devices and browsers

### 1.2 Web Vitals Monitoring (30 minutes)

**Core Web Vitals to Track**:
- **LCP** (Largest Contentful Paint): < 2.5s (Good)
- **FID** (First Input Delay): < 100ms (Good)
- **CLS** (Cumulative Layout Shift): < 0.1 (Good)
- **TTFB** (Time to First Byte): < 600ms (Good)
- **FCP** (First Contentful Paint): < 1.8s (Good)

**Implementation**:

Create [`web/src/lib/analytics/web-vitals.ts`](web/src/lib/analytics/web-vitals.ts:1):
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to Vercel Analytics
  if (window.va) {
    window.va('event', {
      name: metric.name,
      data: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      },
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }
}
```

### 1.3 Error Tracking Setup (45 minutes)

**Option 1: Sentry (Recommended)**

1. Create Sentry account: https://sentry.io/signup/
2. Create new project: "SafeWork Pro"
3. Get DSN from project settings

**Install Sentry**:
```bash
cd web
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configure Sentry** in [`web/sentry.client.config.ts`](web/sentry.client.config.ts:1):
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

**Add to Environment Variables**:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token
```

**Option 2: LogRocket (Alternative)**

1. Create LogRocket account: https://logrocket.com/signup/
2. Get app ID from dashboard
3. Install: `npm install logrocket`
4. Initialize in app

---

## Part 2: Performance Baseline Establishment (1 hour)

### 2.1 Lighthouse Audit (30 minutes)

**Run Lighthouse Audit**:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit on production URL
lighthouse https://safework.maasiso.nl \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Run audit on specific pages
lighthouse https://safework.maasiso.nl/tras \
  --output json \
  --output-path ./lighthouse-tras.json
```

**Target Scores** (Production):
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95
- PWA: > 90

**Critical Pages to Audit**:
1. Landing page (/)
2. Dashboard (/dashboard)
3. TRA List (/tras)
4. TRA Creation (/tras/create)
5. LMRA Execution (/lmra/execute)
6. Settings (/settings)

### 2.2 Bundle Size Analysis (30 minutes)

**Analyze Bundle Size**:

```bash
cd web

# Build for production
npm run build

# Analyze bundle
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

**Target Bundle Sizes**:
- First Load JS: < 200 KB
- Total Page Size: < 500 KB
- Largest Bundle: < 100 KB

**Check Current Sizes**:
```bash
# After build, check .next/analyze/
ls -lh .next/static/chunks/
```

**Performance Budgets** (from [`web/performance-budgets.json`](web/performance-budgets.json:1)):
```json
{
  "budgets": [
    {
      "metric": "risk_calculation",
      "budget": 2,
      "unit": "ms"
    },
    {
      "metric": "tra_hazard_with_risk_render",
      "budget": 16,
      "unit": "ms"
    }
  ]
}
```

---

## Part 3: Performance Optimization (2 hours)

### 3.1 Image Optimization (30 minutes)

**Current Implementation**:
- Next.js Image component used throughout
- Automatic WebP conversion
- Lazy loading enabled

**Optimization Checklist**:
- [ ] Verify all images use `next/image`
- [ ] Set appropriate `sizes` prop for responsive images
- [ ] Use `priority` for above-the-fold images
- [ ] Compress images before upload (max 1MB)
- [ ] Use SVG for icons and logos

**Example Optimization**:
```typescript
import Image from 'next/image';

// Before
<img src="/logo.png" alt="Logo" />

// After
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
  sizes="(max-width: 768px) 100vw, 200px"
/>
```

### 3.2 Code Splitting & Lazy Loading (45 minutes)

**Dynamic Imports for Heavy Components**:

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const TraWizard = dynamic(() => import('@/components/forms/TraWizard'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR if not needed
});

const LMRAWizard = dynamic(() => import('@/components/lmra/LMRAWizard'), {
  loading: () => <LoadingSpinner />,
});

const ComplianceReport = dynamic(() => import('@/components/vca/ComplianceReport'), {
  loading: () => <LoadingSpinner />,
});
```

**Route-based Code Splitting**:
- Already handled by Next.js automatically
- Each page in `app/` directory is a separate chunk

**Component-level Code Splitting**:
```typescript
// Split large component libraries
const ReactPDF = dynamic(() => import('@react-pdf/renderer'), {
  ssr: false,
});

const Chart = dynamic(() => import('react-chartjs-2'), {
  ssr: false,
});
```

### 3.3 API Response Optimization (45 minutes)

**Caching Strategy**:

1. **Static Data** (Hazard Library, Templates):
```typescript
// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  const hazards = await getHazardLibrary();
  return Response.json(hazards, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

2. **Dynamic Data** (TRAs, LMRAs):
```typescript
// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  
  const tras = await getTRAs(orgId);
  return Response.json(tras, {
    headers: {
      'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

3. **Real-time Data** (Notifications, Live Updates):
```typescript
// No caching
export const revalidate = 0;

export async function GET() {
  const notifications = await getRealtimeNotifications();
  return Response.json(notifications, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
```

**Pagination & Filtering**:
```typescript
// Limit results to reduce payload size
const ITEMS_PER_PAGE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE));
  
  const tras = await getTRAs({
    limit,
    offset: (page - 1) * limit,
  });
  
  return Response.json({
    data: tras,
    pagination: {
      page,
      limit,
      total: tras.length,
      hasMore: tras.length === limit,
    },
  });
}
```

---

## Part 4: Monitoring Dashboard Setup (30 minutes)

### 4.1 Create Performance Dashboard

**Metrics to Track**:

1. **Page Load Metrics**:
   - Average page load time
   - 95th percentile load time
   - Slowest pages

2. **API Performance**:
   - Average API response time
   - 95th percentile response time
   - Slowest endpoints
   - Error rate

3. **User Experience**:
   - Core Web Vitals (LCP, FID, CLS)
   - Bounce rate
   - Time on page
   - Pages per session

4. **Resource Usage**:
   - Bundle size over time
   - Image size over time
   - Total page weight

### 4.2 Set Up Alerts

**Critical Alerts** (Immediate notification):
- Error rate > 1%
- API response time > 3s (95th percentile)
- LCP > 4s (Poor)
- Server errors (5xx)

**Warning Alerts** (Daily digest):
- Error rate > 0.5%
- API response time > 2s (95th percentile)
- LCP > 2.5s (Needs Improvement)
- Bundle size increase > 10%

**Alert Channels**:
- Email: admin@maasiso.nl
- Slack: #safework-alerts (if configured)
- SMS: For critical production issues

---

## Part 5: Performance Testing (30 minutes)

### 5.1 Synthetic Monitoring

**Setup Uptime Monitoring**:

1. **UptimeRobot** (Free tier):
   - Monitor: https://safework.maasiso.nl
   - Check interval: 5 minutes
   - Alert on: Down, Slow response (> 3s)

2. **Pingdom** (Alternative):
   - Monitor critical pages
   - Check from multiple locations
   - Alert on performance degradation

### 5.2 Real User Monitoring (RUM)

**Already Configured**:
- Vercel Analytics (RUM data)
- Web Vitals reporting
- Error tracking via Sentry

**Verify RUM Data**:
1. Deploy to production
2. Generate real user traffic
3. Check Vercel Analytics dashboard
4. Verify Web Vitals data is being collected
5. Check Sentry for errors

---

## Part 6: Optimization Checklist

### 6.1 Critical Optimizations

- [ ] All images use `next/image` component
- [ ] Heavy components are lazy-loaded
- [ ] API responses are cached appropriately
- [ ] Bundle size is within budget (< 200 KB first load)
- [ ] Lighthouse score > 90 on all metrics
- [ ] Core Web Vitals are in "Good" range
- [ ] Error tracking is configured
- [ ] Performance monitoring is active

### 6.2 Nice-to-Have Optimizations

- [ ] Service Worker for offline support (PWA)
- [ ] Prefetching for critical routes
- [ ] Font optimization (preload, subset)
- [ ] CSS optimization (critical CSS inline)
- [ ] Database query optimization
- [ ] CDN for static assets

---

## Part 7: Performance Regression Prevention

### 7.1 CI/CD Performance Checks

**Add to GitHub Actions** (`.github/workflows/performance.yml`):
```yaml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://preview-${{ github.event.pull_request.number }}.vercel.app
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### 7.2 Bundle Size Monitoring

**Add to `package.json`**:
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "size-limit": "size-limit"
  },
  "size-limit": [
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "limit": "200 KB"
    }
  ]
}
```

---

## Success Criteria

### Production Performance Targets

**Lighthouse Scores**:
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 95
- [ ] SEO: > 95
- [ ] PWA: > 90

**Core Web Vitals**:
- [ ] LCP: < 2.5s (Good)
- [ ] FID: < 100ms (Good)
- [ ] CLS: < 0.1 (Good)

**Bundle Size**:
- [ ] First Load JS: < 200 KB
- [ ] Total Page Size: < 500 KB

**API Performance**:
- [ ] Average response time: < 500ms
- [ ] 95th percentile: < 1s
- [ ] Error rate: < 0.1%

**Monitoring**:
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Alerts set up
- [ ] Performance dashboard accessible

---

## Troubleshooting

### Issue: High LCP (> 2.5s)

**Solutions**:
1. Optimize largest image on page
2. Preload critical resources
3. Reduce server response time
4. Use CDN for static assets

### Issue: High CLS (> 0.1)

**Solutions**:
1. Set explicit width/height on images
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use CSS transforms instead of layout properties

### Issue: Large Bundle Size

**Solutions**:
1. Analyze bundle with `@next/bundle-analyzer`
2. Lazy load heavy components
3. Remove unused dependencies
4. Use dynamic imports for large libraries

### Issue: Slow API Responses

**Solutions**:
1. Add caching headers
2. Optimize database queries
3. Use pagination
4. Implement request debouncing

---

## Next Steps

After completing this guide:

1. ✅ Mark task 4 complete in todo list
2. Move to task 5: E2E Testing
3. Document performance baseline
4. Schedule regular performance audits (monthly)
5. Review and optimize based on real user data

---

## Reference Links

- Vercel Analytics: https://vercel.com/docs/analytics
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- Next.js Performance: https://nextjs.org/docs/advanced-features/measuring-performance
- Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-09 22:41 CET
**Maintained By**: SafeWork Pro Performance Team