# Performance gids voor productie en staging

Doel
- Beschrijf hoe je prestaties meet, profielt en verbetert voor deze applicatie (Next.js + Firebase).
- Richtlijnen voor performance budgets, profiling, caching en monitoring.

Belangrijkste principes
- Meet eerst: gebruik real user metrics (RUM) en synthetic tests.
- Focus op worst‑case: langzame netwerken en koude starts.
- Sla premature optimalisatie over — profileer en verbeter waar het meeste winst is.

Meetpunten en KPI's
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID) / Interaction to Next Paint (INP)
- Total Blocking Time (TBT)
- Time to Interactive (TTI)
- Backend: API latency (p95, p99), cold starts (Cloud Functions), DB read/write latency

Tools en dashboards
- Browser RUM: Vercel Analytics of Google Analytics / Web Vitals (collect via instrumentation.ts)
- Synthetic: Lighthouse CI of WebPageTest
- Backend: Google Cloud Monitoring, Logs-based Metrics
- Tracing: OpenTelemetry / Firebase Performance Monitoring / Sentry Performance
- Profiling: Chrome DevTools, Node Clinic (voor server-side), V8 profiler

Frontend optimalisaties
- Code splitting: gebruik Next.js dynamic imports en route-based code splitting.
- Image optimization: Next/Image of vercel/image optimization; serve responsive images and lazy-load.
- Font loading: preload kritieke fonts; gebruik font-display: swap.
- CSS: Critical CSS inline voor boven-de-vouw; tree-shake en purgen (Tailwind purge).
- Avoid large JS bundles: elimineer unused polyfills, upgrade libraries, gebruik lighter alternatives.
- Reduce runtime work: minimaliseer heavy client-side computations en long tasks.
- Caching: stel cache-control headers correct in (statische assets vs SSR).
- CDN: statische assets via Vercel / CDN. Gebruik een edge-cache voor SSR pages waar mogelijk.

Server / Hosting (Vercel & Edge)
- Gebruik ISR / static generation voor pagina's die niet per‑request veranderd moeten worden.
- Edge functions nuttig voor lage latentietaken; let op cold start gedrag.
- Houd builds snel: beperk getransformeerde assets en heavy webpack plugins.
- Vercel Regions: zet kritieke functies dichter bij je gebruikers.

API & Backend optimalisaties
- Database reads: gebruik indexed queries en beperk result set size.
- Firestore: gebruik proper indexing, denormalize waar zinvol en batch reads.
- Cloud Functions: kies Node runtime LTS; houdt functies klein en verantwoordelijk.
- Connection pooling: voor externe databases of services, respecteer connection limits.
- Reduce chattiness: combineer meerdere kleine requests tot één endpoint wanneer mogelijk.

Caching strategieën
- HTTP caching: juiste Cache-Control en stale-while-revalidate where applicable.
- Edge cache: Vercel / CDN voor statische content en cachable SSR pages.
- Client cache: leverage service workers / IndexedDB for offline and fast repeat visits.
- Server-side caching: in-memory caches (Redis) of memcached voor dure computations.

Database-specific
- Firestore rules: vermijd queries die niet ondersteund worden door indexes.
- Paginate: gebruik cursor-based pagination.
- Batched writes: combineer waar mogelijk om latentie te verlagen.
- Monitor read/write counts en kosten: performance tegen cost tradeoffs.

Performance budgets en CI
- Stel budgets (e.g. LCP < 2.5s, TBT < 200ms) en enforce via Lighthouse CI.
- Voeg Lighthouse CI in CI-pipeline: blokkeer regressies op PR niveau.
- Automatische performance alerts: Cloud Monitoring or Sentry when p95 API latency breaches threshold.

Profiling workflow
1. Reproduceer issue locally or via synthetic test.
2. Capture Lighthouse report and Chrome Performance trace.
3. For server: capture CPU/heap profile, trace cold starts.
4. Identify hotspots and iterate small, measurable changes.
5. Re-run synthetic tests and compare before/after metrics.

Observability & alerts
- Key alerts:
  - API p95 latency > threshold
  - Error rate spike (5xx) in backend
  - LCP regression > 10% vs baseline
  - Build time regressions or failed deployments
- Integratie: Cloud Monitoring + Sentry + Slack / PagerDuty for ops alerts.

Testing performance in CI
- Start emulator for backend-dependent tests (use export snapshots).
- Run Lighthouse headless in CI with stable emulation settings.
- Store reports as artifacts for PR review.

Budget checklist (kort)
- [ ] LCP < 2.5s (mobile)
- [ ] FCP < 1.8s
- [ ] TBT < 200ms
- [ ] JS bundle < 150 KB (gzipped) per page critical path
- [ ] API p95 < 300ms for core endpoints

Rollout en canary strategie
- Progressive rollouts: deploy to a small percentage (Vercel preview, feature flags).
- Monitor performance signals before full rollout.
- Revert quickly on regressions.

Common pitfalls & mitigaties
- Grote third-party scripts: lazy-load of remove.
- Blocking main thread work: break into web workers.
- Excessive re-renders in React: memoization and useMemo/useCallback.
- Unindexed Firestore queries: add composite indexes or restructure queries.

Documentatie verwijzingen in repo
- Instrumentation voorbeelden: [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1)
- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Firebase emulator docs: [`FIREBASE_EMULATOR_GUIDE.md`](FIREBASE_EMULATOR_GUIDE.md:1)

Afronding
- Implementeer meet- en alarmregels eerst, vervolgens profileer hotspots.
- Verbeteringen moeten klein, meetbaar en terugdraaibaar zijn.