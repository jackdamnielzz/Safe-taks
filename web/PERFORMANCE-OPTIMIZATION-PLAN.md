# Performance Optimalisatie Plan - SafeWork Pro

**Datum**: 5 november 2025  
**Probleem**: Lange laadtijden bij opstarten en trage interacties binnen de applicatie

## 🔍 Geïdentificeerde Problemen

### 1. Build Warnings & Errors
- **ESLint errors** blokkeren production build
- Veel ongebruikte imports en variabelen
- `require()` statements in plaats van ES6 imports
- Prettier formatting issues

### 2. Bundle Size Issues (Verwacht)
Gebaseerd op de configuratie en dependencies:
- **Firebase SDK**: ~500KB (firebase, firebase-admin)
- **Recharts**: ~200KB (charts library)
- **jsPDF + xlsx**: ~300KB (report generation)
- **Sentry**: ~100KB (error tracking)
- **Stripe**: ~50KB (payments)
- **Totaal geschat**: >1.5MB initial bundle

### 3. Code Splitting Problemen
- Babel config overschrijft SWC (langzamere builds)
- PWA is uitgeschakeld (geen offline caching)
- Veel heavy libraries worden niet lazy loaded
- Server Components niet optimaal gebruikt

### 4. Development vs Production
- Development mode is veel langzamer
- Hot reload kan traag zijn met grote codebase
- Babel transpilatie in plaats van snellere SWC

## 🎯 Optimalisatie Strategie

### Fase 1: Quick Wins (1-2 uur)
**Impact**: Hoog | **Effort**: Laag

1. **Fix ESLint Errors**
   - Verwijder ongebruikte imports
   - Fix require() statements
   - Run prettier format

2. **Enable SWC Compiler**
   - Verwijder babel.config.js
   - Gebruik Next.js native SWC (3-5x sneller)

3. **Lazy Load Heavy Components**
   ```typescript
   // Charts
   const RiskCalculator = dynamic(() => import('@/components/risk/RiskCalculator'))
   const ComplianceReport = dynamic(() => import('@/components/vca/ComplianceReport'))
   
   // Wizards
   const TraWizard = dynamic(() => import('@/components/forms/TraWizard'))
   const LMRAWizard = dynamic(() => import('@/components/lmra/LMRAWizard'))
   ```

4. **Optimize Firebase Imports**
   ```typescript
   // ❌ Bad - imports entire SDK
   import firebase from 'firebase/app'
   
   // ✅ Good - tree-shakeable
   import { getAuth } from 'firebase/auth'
   import { getFirestore } from 'firebase/firestore'
   ```

### Fase 2: Bundle Optimization (2-3 uur)
**Impact**: Hoog | **Effort**: Medium

1. **Code Splitting per Route**
   - Admin pages in separate chunk
   - Reports/Analytics in separate chunk
   - Compliance features in separate chunk

2. **Vendor Chunking**
   ```javascript
   // next.config.ts
   webpack: (config) => {
     config.optimization.splitChunks = {
       chunks: 'all',
       cacheGroups: {
         firebase: {
           test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
           name: 'firebase',
           priority: 40,
         },
         charts: {
           test: /[\\/]node_modules[\\/]recharts[\\/]/,
           name: 'charts',
           priority: 30,
         },
         reports: {
           test: /[\\/]node_modules[\\/](jspdf|xlsx)[\\/]/,
           name: 'reports',
           priority: 30,
         },
       },
     }
   }
   ```

3. **Remove Unused Dependencies**
   - Audit package.json
   - Remove unused packages
   - Use lighter alternatives waar mogelijk

4. **Image Optimization**
   - Gebruik Next.js Image component
   - Lazy load images
   - Optimize image formats (WebP)

### Fase 3: Runtime Performance (2-3 uur)
**Impact**: Medium | **Effort**: Medium

1. **Memoization**
   ```typescript
   // Expensive calculations
   const riskScore = useMemo(() => 
     calculateRisk(probability, exposure, consequence),
     [probability, exposure, consequence]
   )
   
   // Callbacks
   const handleSubmit = useCallback(() => {
     // ...
   }, [dependencies])
   ```

2. **Virtualization voor Lange Lijsten**
   ```typescript
   // Voor TRA/LMRA lijsten met 100+ items
   import { FixedSizeList } from 'react-window'
   ```

3. **Debounce Search/Filter**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce((value) => setSearchTerm(value), 300),
     []
   )
   ```

4. **Optimize Firestore Queries**
   ```typescript
   // ❌ Bad - fetches all data
   const tras = await getDocs(collection(db, 'tras'))
   
   // ✅ Good - paginated with limit
   const tras = await getDocs(
     query(collection(db, 'tras'), limit(20))
   )
   ```

### Fase 4: Caching & PWA (3-4 uur)
**Impact**: Hoog | **Effort**: Medium

1. **Re-enable PWA**
   ```javascript
   // next.config.ts
   const pwaConfig = {
     dest: 'public',
     disable: false, // Enable PWA
     register: true,
     skipWaiting: true,
   }
   ```

2. **Service Worker Caching**
   - Cache static assets
   - Cache API responses
   - Offline fallback pages

3. **React Query / SWR**
   ```typescript
   // Cache API responses
   const { data, isLoading } = useSWR('/api/tras', fetcher, {
     revalidateOnFocus: false,
     dedupingInterval: 60000, // 1 minute
   })
   ```

4. **IndexedDB voor Offline Data**
   - Cache TRAs locally
   - Sync when online
   - Reduce API calls

### Fase 5: Development Experience (1-2 uur)
**Impact**: Medium | **Effort**: Laag

1. **Fast Refresh Optimization**
   ```javascript
   // next.config.ts
   experimental: {
     optimizeCss: true,
     optimizePackageImports: [
       'recharts',
       'lucide-react',
       '@radix-ui/react-dialog',
     ],
   }
   ```

2. **Turbopack (Next.js 15)**
   ```bash
   # Development met Turbopack (10x sneller)
   npm run dev -- --turbo
   ```

3. **Selective Compilation**
   - Compile alleen gewijzigde files
   - Skip type checking in dev (run apart)

## 📊 Verwachte Resultaten

### Voor Optimalisatie
- **Initial Load**: 5-10 seconden
- **Time to Interactive**: 8-12 seconden
- **Bundle Size**: ~1.5MB
- **Lighthouse Score**: 60-70

### Na Optimalisatie
- **Initial Load**: 1-2 seconden (-80%)
- **Time to Interactive**: 2-3 seconden (-75%)
- **Bundle Size**: ~400KB (-73%)
- **Lighthouse Score**: 90-95

### Per Fase Verbetering
1. **Fase 1**: -30% load time (ESLint fix + SWC)
2. **Fase 2**: -40% bundle size (code splitting)
3. **Fase 3**: -50% interaction time (memoization)
4. **Fase 4**: -60% repeat visits (caching)
5. **Fase 5**: -70% dev build time (Turbopack)

## 🚀 Implementatie Volgorde

### Prioriteit 1 (Vandaag)
1. ✅ Fix ESLint errors (blokkeren build)
2. ✅ Enable SWC compiler
3. ✅ Lazy load heavy components
4. ✅ Optimize Firebase imports

### Prioriteit 2 (Deze Week)
5. Bundle optimization
6. Code splitting
7. Vendor chunking
8. Remove unused deps

### Prioriteit 3 (Volgende Week)
9. Runtime optimizations
10. Memoization
11. Query optimization
12. Virtualization

### Prioriteit 4 (Later)
13. Re-enable PWA
14. Service worker
15. Offline support
16. Development optimizations

## 🔧 Tools voor Monitoring

### Bundle Analysis
```bash
# Analyze bundle
npm run build:analyze

# Check bundle sizes
npx next-bundle-analyzer
```

### Performance Monitoring
```bash
# Lighthouse
npx lighthouse http://localhost:3000

# Web Vitals
npm install @vercel/analytics
```

### Development
```bash
# Build time analysis
npm run build -- --profile

# Memory usage
node --inspect npm run dev
```

## 📝 Checklist

### Fase 1: Quick Wins
- [ ] Fix alle ESLint errors
- [ ] Verwijder babel.config.js
- [ ] Enable SWC in next.config.ts
- [ ] Lazy load TraWizard
- [ ] Lazy load LMRAWizard
- [ ] Lazy load RiskCalculator
- [ ] Lazy load ComplianceReport
- [ ] Optimize Firebase imports
- [ ] Test build succesvol
- [ ] Verify bundle sizes

### Fase 2: Bundle Optimization
- [ ] Implement vendor chunking
- [ ] Split admin routes
- [ ] Split report routes
- [ ] Audit dependencies
- [ ] Remove unused packages
- [ ] Optimize images
- [ ] Test bundle size reduction

### Fase 3: Runtime Performance
- [ ] Add useMemo voor calculations
- [ ] Add useCallback voor handlers
- [ ] Implement virtualization
- [ ] Add debounce voor search
- [ ] Optimize Firestore queries
- [ ] Add pagination
- [ ] Test interaction speed

### Fase 4: Caching & PWA
- [ ] Re-enable PWA
- [ ] Configure service worker
- [ ] Implement SWR/React Query
- [ ] Add IndexedDB caching
- [ ] Test offline functionality
- [ ] Verify cache strategy

### Fase 5: Development
- [ ] Enable Turbopack
- [ ] Optimize Fast Refresh
- [ ] Configure selective compilation
- [ ] Test dev build speed
- [ ] Document improvements

## 🎯 Success Criteria

### Must Have
- ✅ Build succesvol zonder errors
- ✅ Initial load < 3 seconden
- ✅ Bundle size < 500KB
- ✅ Lighthouse score > 85

### Should Have
- ✅ Time to Interactive < 4 seconden
- ✅ First Contentful Paint < 1.5 seconden
- ✅ Largest Contentful Paint < 2.5 seconden
- ✅ Cumulative Layout Shift < 0.1

### Nice to Have
- ✅ Dev build time < 5 seconden
- ✅ Hot reload < 1 seconde
- ✅ Offline functionality
- ✅ PWA installable

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [SWC Compiler](https://nextjs.org/docs/architecture/nextjs-compiler)

---

**Status**: Plan Created  
**Next Action**: Start Fase 1 - Quick Wins
