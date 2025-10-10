# Firebase Performance Monitoring - Alert Configuration Guide

## Overview
This guide provides step-by-step instructions for configuring Firebase Performance alerts to monitor critical performance thresholds for SafeWork Pro. The application already includes comprehensive performance monitoring infrastructure with custom traces and Web Vitals tracking.

## Performance Thresholds Summary

| Operation | Target | Alert Threshold | Priority |
|-----------|--------|----------------|----------|
| Authentication | <500ms | >750ms | Critical |
| TRA Operations | <1s | >1500ms | High |
| LMRA Execution | <800ms | >1200ms | Critical |
| Dashboard Reports | <2s | >3000ms | High |
| Page Load | <2s | >3000ms | Critical |
| First Contentful Paint | <1.8s | >2500ms | Critical |
| Largest Contentful Paint | <2.5s | >3500ms | Critical |
| First Input Delay | <100ms | >150ms | High |

## Step 1: Access Firebase Console

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **hale-ripsaw-403915**
3. Go to **Performance** in the left sidebar

## Step 2: Configure Custom Alerts

### Authentication Performance Alert
1. Click **"Create Alert"** in the Performance dashboard
2. Select **"Custom trace"**
3. Choose trace: `tra_create` (or configure for all TRA traces)
4. Set condition: **Duration > 750ms**
5. Aggregation: **95th percentile**
6. Time period: **1 hour**
7. Alert name: `Auth Performance - Critical`
8. Notification channels: Email to your development team

### TRA Operations Alert
1. Click **"Create Alert"**
2. Select **"Custom trace"**
3. Choose traces: `tra_create`, `tra_load`, `tra_update`, `tra_approve`
4. Set condition: **Duration > 1500ms**
5. Aggregation: **95th percentile**
6. Time period: **1 hour**
7. Alert name: `TRA Operations - Slow`
8. Notification channels: Email + Slack (if configured)

### LMRA Execution Alert (Safety Critical)
1. Click **"Create Alert"**
2. Select **"Custom trace"**
3. Choose trace: `lmra_execute`
4. Set condition: **Duration > 1200ms**
5. Aggregation: **95th percentile**
6. Time period: **30 minutes** (shorter period for safety-critical)
7. Alert name: `LMRA Execution - Critical Delay`
8. Notification channels: Email + SMS (if configured)

### Dashboard Reports Alert
1. Click **"Create Alert"**
2. Select **"Custom trace"**
3. Choose traces: `dashboard_load`, `report_generate_pdf`, `report_generate_excel`
4. Set condition: **Duration > 3000ms**
5. Aggregation: **95th percentile**
6. Time period: **1 hour**
7. Alert name: `Dashboard/Reports - Performance`
8. Notification channels: Email

## Step 3: Configure Web Vitals Alerts

### Page Load Performance
1. Click **"Create Alert"**
2. Select **"Page load"**
3. Set condition: **Duration > 3000ms**
4. Aggregation: **95th percentile**
5. Time period: **1 hour**
6. Alert name: `Page Load - Critical`

### Core Web Vitals - LCP
1. Click **"Create Alert"**
2. Select **"Largest Contentful Paint"**
3. Set condition: **Duration > 3500ms**
4. Aggregation: **75th percentile**
5. Time period: **1 hour**
6. Alert name: `LCP - Poor Performance`

### Core Web Vitals - FID
1. Click **"Create Alert"**
2. Select **"First Input Delay"**
3. Set condition: **Duration > 150ms**
4. Aggregation: **75th percentile**
5. Time period: **1 hour**
6. Alert name: `FID - Poor Interactivity`

## Step 4: Set Up Alert Destinations

### Email Notifications
1. Go to **Project Settings** > **Integrations**
2. Add team email addresses for critical alerts
3. Configure different email groups for different severity levels

### Slack Integration (Optional)
1. Create a Slack webhook URL
2. Go to **Project Settings** > **Integrations** > **Slack**
3. Add webhook for non-critical alerts

### PagerDuty/SMS (For Critical Alerts)
1. Set up PagerDuty integration in Firebase Console
2. Configure SMS notifications for LMRA execution delays

## Step 5: Create Alert Response Procedures

### Immediate Response (Critical Alerts)
1. **LMRA Execution >1200ms**: Check Firebase Functions and external APIs (OpenWeather, Geolocation)
2. **Authentication >750ms**: Verify Firebase Auth service status
3. **Page Load >3000ms**: Check CDN, Firebase Hosting, and bundle size

### Investigation Process
1. Review Firebase Performance dashboard for trends
2. Check error rates in Sentry
3. Analyze bundle size in Vercel Analytics
4. Review recent deployments for performance regressions

## Step 6: Monitor and Optimize

### Weekly Review Process
1. Review performance trends in Firebase Console
2. Analyze slow traces and identify optimization opportunities
3. Update performance budgets based on real-world data
4. Adjust alert thresholds as needed

### Monthly Optimization
1. Bundle size analysis using `@next/bundle-analyzer`
2. Database query optimization review
3. CDN and caching strategy optimization
4. Mobile performance review (field workers)

## Step 7: Integration with Existing Monitoring

The Firebase Performance alerts complement existing monitoring:

- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Web Vitals and Speed Insights
- **UptimeRobot**: Availability monitoring
- **Load Testing**: Performance validation (Artillery + k6)

## Troubleshooting

### Common Issues

**Alerts not triggering:**
- Check if Performance Monitoring SDK is properly initialized
- Verify custom traces are being recorded
- Check alert conditions and thresholds

**False positives:**
- Adjust aggregation percentiles (try 99th instead of 95th)
- Increase time periods for more stable measurements
- Review alert conditions for accuracy

**Missing data:**
- Ensure Performance Monitoring is enabled in production
- Check if custom traces are being called correctly
- Verify Firebase configuration

## Next Steps

1. ✅ Complete this alert configuration in Firebase Console
2. Run load tests to validate performance targets
3. Monitor alerts for 1-2 weeks to fine-tune thresholds
4. Set up regular performance review meetings
5. Integrate performance metrics into deployment pipeline

## Support Resources

- [Firebase Performance Monitoring Documentation](https://firebase.google.com/docs/perf-mon)
- [Web Vitals Reference](https://web.dev/vitals/)
- [Performance Budgets Guide](web/performance-budgets.json)
- [Bundle Analysis Guide](BUNDLE_ANALYSIS_GUIDE.md)

---

**Last Updated**: October 7, 2025
**Owner**: Development Team
**Review Schedule**: Monthly