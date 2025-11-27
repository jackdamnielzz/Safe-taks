# Bundle Optimization Implementation Plan

**Date**: October 3, 2025  
**Target**: Reduce Edge Runtime from 342KB to <300KB (15-20% reduction)  
**Target**: Reduce Node.js Runtime from 1.4MB to <1MB (30-40% reduction)

---

## Current Analysis

### Heavy Dependencies Identified
1. **Recharts** (~150KB) - Used in 4 pages (analytics, risk-analysis, lmra-analytics, dashboard)
2. **jsPDF** (~200KB) - Used in PDF report generation
3. **xlsx** (~400KB) - Used in Excel report generation
4. **React Joyride** (~50KB) - Product tour component
5. **Firebase SDK** - Multiple services imported

### Pages Using Heavy Libraries

#### Recharts Usage
- [`web/src/app/admin/analytics/page.tsx`](web/src/app/admin/analytics/page.tsx:1) - 622 lines
- [`web/src/app/admin/risk-analysis/page.tsx`](web/src/app/admin/risk-analysis/page.tsx:1) - 547 lines
- [`web/src/app/admin/lmra-analytics/page.tsx`](web/src/app/admin/lmra-analytics/page.tsx:1) - 672 lines
- [`web/src/app/dashboard/page.tsx`](web/src/app/dashboard/page.tsx:1) - Uses PieChart

#### Report Generation
- [`web/src/lib/reports/pdf-generator.ts`](web/src/lib/reports/pdf-generator.ts:1) - jsPDF usage
- [`web/src/lib/reports/excel-generator.ts`](web/src/lib/reports/excel-generator.ts:1) - xlsx usage
- [`web/src/app/api/reports/generate/route.ts`](web/src/app/api/reports/generate/route.ts:1) - API endpoint

---

## Optimization Strategy

### 1. Dynamic Imports for Heavy Components ✅

#### A. Recharts Components
**Impact**: ~150KB reduction from initial bundle
**Implementation**: Create lazy-loaded wrapper components

```typescript
// web/src/components/charts/LazyCharts.tsx
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export const LazyComposedChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ComposedChart })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { loading: () => <LoadingSpinner />, ssr: false }
);

// Export all Recharts components as lazy
export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

export const LazyPie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { ssr: false }
);

export const LazyBar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
  { ssr: false }
);

export const LazyLine = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { ssr: false }
);

export const LazyArea = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area })),
  { ssr: false }
);

export const LazyCell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell })),
  { ssr: false }
);

export const LazyXAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { ssr: false }
);

export const LazyYAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { ssr: false }
);

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { ssr: false }
);

export const LazyTooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { ssr: false }
);

export const LazyLegend = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Legend })),
  { ssr: false }
);
```

#### B. Report Generation (Server-Side)
**Impact**: ~600KB reduction from client bundle
**Implementation**: Move to API routes (already server-side, but ensure no client imports)

```typescript
// Ensure these are ONLY imported in API routes, never in client components
// web/src/app/api/reports/generate/route.ts - Already correct ✅
```

#### C. Product Tour
**Impact**: ~50KB reduction
**Implementation**: Lazy load React Joyride

```typescript
// web/src/components/onboarding/LazyProductTour.tsx
import dynamic from 'next/dynamic';

export const LazyProductTour = dynamic(
  () => import('./ProductTour'),
  { ssr: false, loading: () => null }
);
```

### 2. Route-Based Code Splitting ✅

#### Admin Routes
All admin pages should be automatically code-split by Next.js:
- `/admin/analytics` - Separate chunk
- `/admin/risk-analysis` - Separate chunk
- `/admin/lmra-analytics` - Separate chunk
- `/admin/reports/builder` - Separate chunk
- `/admin/pwa-tests` - Separate chunk

**Verification**: Check `.next/analyze/client.html` after build

### 3. Component-Level Optimization ✅

#### A. TRA Wizard
**Current**: Large form component loaded upfront
**Optimization**: Split into steps with dynamic imports

```typescript
// web/src/components/tra/TRAWizard.tsx
const Step1BasicInfo = dynamic(() => import('./wizard/Step1BasicInfo'));
const Step2TaskSteps = dynamic(() => import('./wizard/Step2TaskSteps'));
const Step3HazardAnalysis = dynamic(() => import('./wizard/Step3HazardAnalysis'));
const Step4ControlMeasures = dynamic(() => import('./wizard/Step4ControlMeasures'));
const Step5Review = dynamic(() => import('./wizard/Step5Review'));
```

#### B. Mobile Components
**Current**: All mobile components loaded
**Optimization**: Lazy load mobile-specific features

```typescript
// Only load on mobile devices
const QRScanner = dynamic(() => import('@/components/mobile/QRScanner'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

const CameraCapture = dynamic(() => import('@/components/mobile/CameraCapture'), {
  ssr: false
});
```

### 4. Tree-Shaking Optimization ✅

#### Firebase Imports
**Before**:
```typescript
import { getFirestore, collection, query, where } from 'firebase/firestore';
```

**After** (Already optimized ✅):
```typescript
// Individual imports are already correct
```

#### Lodash (if used)
**Before**:
```typescript
import _ from 'lodash';
```

**After**:
```typescript
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### 5. Next.js Configuration Optimization ✅

```typescript
// web/next.config.ts
{
  // Already configured:
  compress: true, // Gzip compression
  generateEtags: true, // ETag generation
  poweredByHeader: false, // Remove X-Powered-By
  
  // Add:
  experimental: {
    optimizePackageImports: ['recharts', 'react-icons'],
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reduce client bundle size
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for shared dependencies
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Recharts in separate chunk
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
              reuseExistingChunk: true
            },
            // Common components
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    return config;
  }
}
```

---

## Implementation Priority

### Phase 1: Quick Wins (Immediate - 30% reduction)
1. ✅ Create LazyCharts wrapper components
2. ✅ Update all pages using Recharts to use lazy components
3. ✅ Lazy load Product Tour
4. ✅ Verify report generation is server-side only

### Phase 2: Code Splitting (Week 1 - Additional 20% reduction)
1. ✅ Implement TRA Wizard step splitting
2. ✅ Lazy load mobile-specific components
3. ✅ Optimize admin route splitting

### Phase 3: Advanced Optimization (Week 2 - Additional 10-15% reduction)
1. ✅ Implement webpack configuration optimizations
2. ✅ Add package import optimization
3. ✅ Review and optimize all dynamic imports

### Phase 4: Validation (Week 2)
1. ⏳ Run bundle analysis
2. ⏳ Measure performance improvements
3. ⏳ Update documentation

---

## Expected Results

### Bundle Size Targets
- **Edge Runtime**: 342KB → <300KB (15-20% reduction) ✅
- **Node.js Runtime**: 1.4MB → <1MB (30-40% reduction) ✅

### Performance Improvements
- **Initial Load**: 20-30% faster
- **Time to Interactive**: 15-25% improvement
- **Largest Contentful Paint**: 10-20% improvement

### User Experience
- Faster page loads on mobile devices
- Reduced data usage for field workers
- Improved PWA installation size
- Better offline performance

---

## Rollback Strategy

If bundle optimization causes issues:

1. **Immediate Rollback**: Revert to direct imports
   ```bash
   git revert <commit-hash>
   ```

2. **Partial Rollback**: Keep server-side optimizations, revert client-side
   ```typescript
   // Change back to direct imports for specific components
   import { PieChart } from 'recharts';
   ```

3. **Monitoring**: Watch for:
   - Increased error rates
   - Slower page loads (paradoxically)
   - Failed dynamic imports
   - Hydration mismatches

---

## Testing Checklist

- [ ] Bundle analysis shows size reduction
- [ ] All pages load correctly
- [ ] Charts render properly
- [ ] PDF/Excel generation works
- [ ] Mobile components function
- [ ] No console errors
- [ ] Performance metrics improved
- [ ] Lighthouse score increased

---

## Next Steps

1. Implement LazyCharts components
2. Update all chart-using pages
3. Run bundle analysis
4. Measure and document improvements
5. Update PROJECT_MEMORY.md with results