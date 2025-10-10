# KPI Catalog - SafeWork Pro Analytics

**Last Updated**: October 3, 2025  
**Version**: 1.0  
**Owner**: Product Analytics Team

---

## Overview

This document defines the core Key Performance Indicators (KPIs) for SafeWork Pro, a B2B SaaS platform for Task Risk Analysis (TRA) and Last Minute Risk Analysis (LMRA) management. These metrics provide insights into product usage, safety performance, compliance, and user engagement.

### Purpose

- **Product Health**: Monitor overall platform health and usage
- **Safety Performance**: Track risk management effectiveness
- **Compliance**: Ensure regulatory compliance (VCA, ISO45001)
- **User Engagement**: Measure user activation and retention
- **Business Intelligence**: Support data-driven decision making

### Metric Categories

1. **Usage Metrics**: TRAs created, LMRAs executed
2. **Safety Metrics**: Average risk score, compliance rate
3. **Operational Metrics**: Time to approval
4. **Engagement Metrics**: User activation rate

---

## KPI 1: TRAs Created Per Month

### Definition

Number of Task Risk Analyses (TRAs) created within a given time period (typically monthly).

### Business Value

- **Product Adoption**: Indicates active platform usage
- **Growth Indicator**: Shows expansion within organizations
- **Capacity Planning**: Helps forecast infrastructure needs
- **Customer Health**: Low creation rates may indicate churn risk

### Calculation Method

**Formula**:
```
TRAs Created = COUNT(TRAs WHERE createdAt BETWEEN startDate AND endDate)
```

**Data Source**:
- Collection: `organizations/{orgId}/tras`
- Field: `createdAt` (Timestamp)
- Filter: Active TRAs only (`isActive = true`)

**Aggregation**:
- Primary: Monthly count
- Breakdowns: By status, by project, by creator
- Trend: Month-over-month comparison

### Implementation

**TypeScript Interface**: [`TRAsCreatedMetric`](../../web/src/lib/types/metrics.ts:91)

**Calculator Function**: [`calculateTRAsCreated()`](../../web/src/lib/analytics/kpi-calculator.ts:40)

**Query Pattern**:
```typescript
const trasRef = collection(db, `organizations/${orgId}/tras`);
const q = query(
  trasRef,
  where('createdAt', '>=', Timestamp.fromDate(startDate)),
  where('createdAt', '<=', Timestamp.fromDate(endDate))
);
```

### Target Values

| Tier | Monthly Target | Rationale |
|------|---------------|-----------|
| Trial | 5 TRAs | Minimum viable usage |
| Starter | 10 TRAs | Active small team |
| Professional | 50 TRAs | Multiple projects |
| Enterprise | 200+ TRAs | Large organization |

**Default Target**: 10 TRAs/month

### Update Frequency

- **Real-time**: Updated on TRA creation
- **Dashboard**: Refreshed every 5 minutes
- **Reports**: Calculated daily at 00:00 UTC

### Interpretation Guidelines

**Status Indicators**:
- 🟢 **Excellent** (>110% of target): Strong adoption
- 🟡 **Good** (95-110% of target): On track
- 🟠 **Warning** (80-95% of target): Below expectations
- 🔴 **Critical** (<80% of target): Requires intervention

**Trend Analysis**:
- ↑ **Increasing**: Positive growth signal
- → **Stable**: Consistent usage
- ↓ **Decreasing**: Potential churn or seasonal variation

### Related Metrics

- **LMRAs Executed**: Should correlate with TRA creation
- **User Activation Rate**: New users should create TRAs
- **Compliance Rate**: More TRAs should maintain compliance

### Alerts & Thresholds

- **Critical Alert**: <50% of target for 2 consecutive months
- **Warning Alert**: <80% of target for current month
- **Notify**: Safety managers, organization admins

---

## KPI 2: LMRAs Executed Per Month

### Definition

Number of Last Minute Risk Analyses (LMRA) sessions executed within a given time period.

### Business Value

- **Field Activity**: Indicates actual field work execution
- **Safety Compliance**: Shows pre-work safety checks are performed
- **Platform Stickiness**: Regular LMRA execution indicates habit formation
- **Risk Prevention**: More LMRAs = better hazard identification

### Calculation Method

**Formula**:
```
LMRAs Executed = COUNT(LMRA Sessions WHERE startedAt BETWEEN startDate AND endDate)
```

**Data Source**:
- Collection: `organizations/{orgId}/lmraSessions`
- Field: `startedAt` (Timestamp)
- Filter: All sessions (including incomplete)

**Aggregation**:
- Primary: Monthly count
- Breakdowns: By assessment result, by project, by performer
- Metrics: Completion rate, stop work rate

### Implementation

**TypeScript Interface**: [`LMRAsExecutedMetric`](../../web/src/lib/types/metrics.ts:134)

**Calculator Function**: [`calculateLMRAsExecuted()`](../../web/src/lib/analytics/kpi-calculator.ts:165)

**Query Pattern**:
```typescript
const lmrasRef = collection(db, `organizations/${orgId}/lmraSessions`);
const q = query(
  lmrasRef,
  where('startedAt', '>=', Timestamp.fromDate(startDate)),
  where('startedAt', '<=', Timestamp.fromDate(endDate))
);
```

### Target Values

| Tier | Monthly Target | Rationale |
|------|---------------|-----------|
| Trial | 10 LMRAs | Testing phase |
| Starter | 20 LMRAs | Small team daily usage |
| Professional | 100 LMRAs | Multiple teams |
| Enterprise | 500+ LMRAs | Large-scale operations |

**Default Target**: 20 LMRAs/month

**Ratio to TRAs**: Typically 2-5 LMRAs per TRA (varies by project duration)

### Update Frequency

- **Real-time**: Updated on LMRA session start
- **Dashboard**: Refreshed every 5 minutes
- **Reports**: Calculated daily at 00:00 UTC

### Interpretation Guidelines

**Assessment Breakdown**:
- **Safe to Proceed**: 70-85% (healthy range)
- **Proceed with Caution**: 10-25% (acceptable)
- **Stop Work**: <5% (target - indicates good hazard identification)

**Completion Rate**:
- Target: >95% (sessions should be completed)
- <90%: Investigate workflow issues

**Stop Work Rate**:
- 2-5%: Healthy (catching real hazards)
- >10%: May indicate overly cautious or poor TRA quality
- <1%: May indicate insufficient hazard awareness

### Related Metrics

- **TRAs Created**: LMRAs depend on active TRAs
- **Average Risk Score**: High-risk TRAs should have more LMRAs
- **User Activation**: Field workers should execute LMRAs regularly

### Alerts & Thresholds

- **Critical Alert**: Stop work rate >15% for 1 week
- **Warning Alert**: Completion rate <90%
- **Notify**: Safety managers, supervisors

---

## KPI 3: Average Risk Score

### Definition

Average Kinney & Wiruth risk score across all active TRAs in the organization.

### Business Value

- **Safety Performance**: Lower scores indicate better risk management
- **Risk Trend**: Track improvement over time
- **Benchmarking**: Compare across projects and organizations
- **Compliance**: Demonstrates risk reduction efforts

### Calculation Method

**Formula**:
```
Average Risk Score = SUM(TRA.overallRiskScore) / COUNT(Active TRAs)
```

**Kinney & Wiruth Formula**:
```
Risk Score = Effect × Exposure × Probability
```

Where:
- **Effect (E)**: Consequence severity (1-100)
- **Exposure (B)**: Frequency of exposure (0.5-10)
- **Probability (W)**: Likelihood of incident (0.1-10)

**Data Source**:
- Collection: `organizations/{orgId}/tras`
- Fields: `overallRiskScore`, `overallRiskLevel`, `status`
- Filter: Active and approved TRAs only

**Aggregation**:
- Primary: Average of all TRA risk scores
- Breakdowns: By risk level distribution, by project
- Statistics: Median, min, max, total hazards analyzed

### Implementation

**TypeScript Interface**: [`AverageRiskScoreMetric`](../../web/src/lib/types/metrics.ts:172)

**Calculator Function**: [`calculateAverageRiskScore()`](../../web/src/lib/analytics/kpi-calculator.ts:290)

**Risk Level Thresholds**:
```typescript
trivial: 0-20
acceptable: 21-70
possible: 71-200
substantial: 201-400
high: 401-1000
very_high: 1000+
```

### Target Values

**Industry Benchmarks**:
- **Construction**: 150-250 (possible to substantial range)
- **Industrial**: 100-200 (acceptable to possible range)
- **Offshore**: 200-300 (substantial range due to high-risk environment)

**Default Target**: 200 (upper bound of "possible" range)

**Improvement Goal**: 10-15% reduction year-over-year

### Update Frequency

- **Real-time**: Updated on TRA approval/activation
- **Dashboard**: Refreshed every 15 minutes
- **Reports**: Calculated daily at 00:00 UTC

### Interpretation Guidelines

**Risk Distribution** (Healthy Organization):
- Trivial: 10-20%
- Acceptable: 30-40%
- Possible: 30-40%
- Substantial: 10-15%
- High: <5%
- Very High: <2%

**Trend Analysis**:
- ↓ **Decreasing**: Positive - risk reduction working
- → **Stable**: Acceptable if within target range
- ↑ **Increasing**: Concerning - investigate root causes

**Red Flags**:
- Average score >400 (substantial/high range)
- >10% of TRAs in "very high" category
- Increasing trend over 3+ months

### Related Metrics

- **Compliance Rate**: Should improve as risk scores decrease
- **Control Measures**: More controls should reduce residual risk
- **LMRA Stop Work Rate**: High-risk TRAs may have more stop work events

### Alerts & Thresholds

- **Critical Alert**: Average score >400 for 1 month
- **Warning Alert**: Increasing trend for 3 consecutive months
- **Notify**: Safety managers, organization admins

---

## KPI 4: Compliance Rate

### Definition

Percentage of TRAs that meet all compliance requirements (VCA, ISO45001, internal standards).

### Business Value

- **Regulatory Compliance**: Demonstrates adherence to safety standards
- **Audit Readiness**: High compliance rate simplifies audits
- **Quality Indicator**: Shows TRA creation quality
- **Risk Management**: Compliant TRAs are more effective

### Calculation Method

**Formula**:
```
Compliance Rate = (Compliant TRAs / Total TRAs) × 100%
```

**Compliance Criteria** (All must be met):
1. ✅ TRA status is "approved" or "active"
2. ✅ All hazards have at least one control measure
3. ✅ Validity period ≤12 months (VCA requirement)
4. ✅ Team members assigned
5. ✅ Required competencies defined

**Data Source**:
- Collection: `organizations/{orgId}/tras`
- Fields: `status`, `taskSteps`, `validFrom`, `validUntil`, `teamMembers`, `requiredCompetencies`
- Filter: Active TRAs created in period

**Aggregation**:
- Primary: Percentage of compliant TRAs
- Breakdowns: By compliance framework (VCA, ISO45001)
- Analysis: Non-compliance reasons with frequency

### Implementation

**TypeScript Interface**: [`ComplianceRateMetric`](../../web/src/lib/types/metrics.ts:211)

**Calculator Function**: [`calculateComplianceRate()`](../../web/src/lib/analytics/kpi-calculator.ts:415)

**Compliance Scoring**:
```typescript
// Each criterion worth 20% (5 criteria = 100%)
complianceScore = (metCriteria / 5) × 100%
```

### Target Values

**Industry Standards**:
- **VCA Certification**: 100% compliance required
- **ISO45001**: 95%+ compliance recommended
- **Internal Target**: 95% minimum

**Default Target**: 95%

### Update Frequency

- **Real-time**: Updated on TRA approval/modification
- **Dashboard**: Refreshed every 15 minutes
- **Reports**: Calculated daily at 00:00 UTC
- **Audit Reports**: Generated on-demand

### Interpretation Guidelines

**Compliance Levels**:
- 🟢 **Excellent** (>98%): Audit-ready
- 🟡 **Good** (95-98%): On track
- 🟠 **Warning** (90-95%): Needs attention
- 🔴 **Critical** (<90%): Immediate action required

**Common Non-Compliance Issues**:
1. Missing control measures (40-50% of issues)
2. Validity period exceeds 12 months (20-30%)
3. No team members assigned (15-20%)
4. Missing required competencies (10-15%)
5. Not approved (5-10%)

**Framework-Specific**:
- **VCA**: Must be 100% for certification
- **ISO45001**: 95%+ recommended for certification

### Related Metrics

- **Average Risk Score**: Compliant TRAs should have lower risk
- **Time to Approval**: Compliant TRAs approve faster
- **TRAs Created**: More TRAs should maintain compliance

### Alerts & Thresholds

- **Critical Alert**: Compliance rate <90% for 1 week
- **Warning Alert**: Compliance rate <95% for current month
- **VCA Alert**: Any non-compliant VCA TRA
- **Notify**: Safety managers, compliance officers, admins

---

## KPI 5: Time to Approval

### Definition

Average time (in hours) from TRA submission to final approval.

### Business Value

- **Operational Efficiency**: Faster approvals enable quicker work start
- **Bottleneck Identification**: Highlights approval workflow issues
- **User Experience**: Long approval times frustrate users
- **Compliance**: Timely approvals support safety compliance

### Calculation Method

**Formula**:
```
Time to Approval = AVG(approvedAt - submittedAt) in hours
```

**Data Source**:
- Collection: `organizations/{orgId}/tras`
- Fields: `submittedAt`, `approvedAt`, `status`
- Filter: TRAs with status = 'approved' and both timestamps present

**Aggregation**:
- Primary: Average hours
- Statistics: Median, min, max
- Breakdowns: By approval stage, by approver
- Insights: Pending approvals, overdue approvals

### Implementation

**TypeScript Interface**: [`TimeToApprovalMetric`](../../web/src/lib/types/metrics.ts:253)

**Calculator Function**: [`calculateTimeToApproval()`](../../web/src/lib/analytics/kpi-calculator.ts:681)

**Calculation Logic**:
```typescript
const hours = (approvedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
const averageHours = totalHours / approvalCount;
```

### Target Values

**Industry Benchmarks**:
- **Urgent Work**: <4 hours
- **Standard Work**: <24 hours
- **Complex TRAs**: <48 hours

**Default Target**: 48 hours (2 business days)

**SLA Tiers**:
- **Premium**: 24 hours
- **Standard**: 48 hours
- **Basic**: 72 hours

### Update Frequency

- **Real-time**: Updated on TRA approval
- **Dashboard**: Refreshed every 15 minutes
- **Reports**: Calculated daily at 00:00 UTC
- **Alerts**: Checked hourly for overdue approvals

### Interpretation Guidelines

**Performance Levels**:
- 🟢 **Excellent** (<24h): Fast-track approval process
- 🟡 **Good** (24-48h): Meeting target
- 🟠 **Warning** (48-72h): Approaching SLA breach
- 🔴 **Critical** (>72h): SLA breach, escalation needed

**Bottleneck Analysis**:
- **By Stage**: Identify which approval step is slowest
- **By Approver**: Identify overloaded or slow approvers
- **By Time**: Identify peak submission times causing delays

**Overdue Threshold**: Submissions older than target hours

### Related Metrics

- **TRAs Created**: More TRAs may increase approval time
- **Compliance Rate**: Non-compliant TRAs take longer to approve
- **User Activation**: Slow approvals reduce user engagement

### Alerts & Thresholds

- **Critical Alert**: Average >72 hours for 1 week
- **Warning Alert**: >10 overdue approvals
- **SLA Breach**: Individual TRA >target hours
- **Notify**: Approvers, safety managers, admins

---

## KPI 6: User Activation Rate

### Definition

Percentage of users who have completed key activation milestones indicating active platform engagement.

### Business Value

- **Onboarding Success**: Measures onboarding effectiveness
- **User Engagement**: Indicates platform value realization
- **Churn Prediction**: Low activation predicts churn
- **Product-Market Fit**: High activation indicates good fit

### Calculation Method

**Formula**:
```
User Activation Rate = (Activated Users / Total Users) × 100%
```

**Activation Criteria** (User must complete ALL):
1. ✅ Profile completed (firstName, lastName present)
2. ✅ Logged in at least once (lastLoginAt exists)
3. ✅ Performed role-specific action:
   - **Admin/Safety Manager**: Created or approved a TRA
   - **Supervisor**: Created a TRA or executed an LMRA
   - **Field Worker**: Executed an LMRA

**Data Source**:
- Collection: `organizations/{orgId}/users`
- Related: `tras` (for TRA creation), `lmraSessions` (for LMRA execution)
- Fields: `firstName`, `lastName`, `lastLoginAt`, `role`, `createdAt`

**Aggregation**:
- Primary: Percentage activated
- Breakdowns: By role, by cohort
- Time Metrics: Average/median days to activation
- Retention: Percentage still active

### Implementation

**TypeScript Interface**: [`UserActivationRateMetric`](../../web/src/lib/types/metrics.ts:298)

**Calculator Function**: [`calculateUserActivationRate()`](../../web/src/lib/analytics/kpi-calculator.ts:876)

**Activation Milestones**:
```typescript
milestones: {
  completedProfile: number;      // Users with complete profile
  createdFirstTRA: number;       // Users who created ≥1 TRA
  executedFirstLMRA: number;     // Users who executed ≥1 LMRA
  invitedTeamMember: number;     // Users who invited others
  approvedFirstTRA: number;      // Users who approved ≥1 TRA
}
```

### Target Values

**Industry Benchmarks** (B2B SaaS):
- **Day 1**: 40-50% (profile completion)
- **Day 7**: 60-70% (first action)
- **Day 30**: 80%+ (full activation)

**Default Target**: 80% activation rate

**Time to Activation**:
- **Fast**: <3 days
- **Standard**: 3-7 days
- **Slow**: >7 days (requires intervention)

### Update Frequency

- **Real-time**: Updated on user actions
- **Dashboard**: Refreshed every 30 minutes
- **Reports**: Calculated daily at 00:00 UTC
- **Cohort Analysis**: Weekly

### Interpretation Guidelines

**Activation Levels**:
- 🟢 **Excellent** (>85%): Strong onboarding
- 🟡 **Good** (75-85%): On track
- 🟠 **Warning** (65-75%): Onboarding issues
- 🔴 **Critical** (<65%): Major onboarding problems

**Role-Specific Expectations**:
- **Admins**: 95%+ (critical users)
- **Safety Managers**: 90%+ (key users)
- **Supervisors**: 80%+ (regular users)
- **Field Workers**: 75%+ (mobile-first users)

**Churn Indicators**:
- Users inactive >30 days after creation
- Users who never completed profile
- Users who logged in once and never returned

### Related Metrics

- **TRAs Created**: Activated users create TRAs
- **LMRAs Executed**: Activated field workers execute LMRAs
- **Retention Rate**: Activated users have higher retention

### Alerts & Thresholds

- **Critical Alert**: Activation rate <65% for new cohort
- **Warning Alert**: >20% of users inactive >14 days
- **Churn Alert**: >10% monthly churn rate
- **Notify**: Product team, customer success, admins

---

## Cross-KPI Analysis

### Healthy Organization Profile

A healthy SafeWork Pro organization typically shows:

| KPI | Healthy Range | Red Flag |
|-----|--------------|----------|
| TRAs Created | 10-50/month | <5 or >200 |
| LMRAs Executed | 20-100/month | <10 or ratio <2:1 |
| Average Risk Score | 100-250 | >400 |
| Compliance Rate | 95-100% | <90% |
| Time to Approval | 12-36 hours | >72 hours |
| User Activation | 80-95% | <70% |

### Correlation Patterns

**Positive Correlations** (Expected):
- TRAs Created ↑ → LMRAs Executed ↑
- User Activation ↑ → TRAs Created ↑
- Compliance Rate ↑ → Average Risk Score ↓

**Negative Correlations** (Concerning):
- TRAs Created ↑ but LMRAs Executed → (TRAs not being used)
- Compliance Rate ↓ and Time to Approval ↑ (quality issues)
- User Activation ↓ and Churn ↑ (onboarding failure)

### Dashboard Layout

**Executive Dashboard** (Monthly View):
```
┌─────────────────────────────────────────────────────────┐
│ Overall Health Score: 87% 🟢                            │
├─────────────────────────────────────────────────────────┤
│ TRAs Created        │ LMRAs Executed  │ Avg Risk Score  │
│ 45 (↑ 12%)         │ 89 (↑ 8%)      │ 185 (↓ 5%)     │
│ Target: 50         │ Target: 100     │ Target: 200     │
├─────────────────────────────────────────────────────────┤
│ Compliance Rate     │ Time to Approval│ User Activation │
│ 96% (→ 0%)         │ 28h (↓ 15%)    │ 82% (↑ 3%)     │
│ Target: 95%        │ Target: 48h     │ Target: 80%     │
└─────────────────────────────────────────────────────────┘
```

---

## Data Quality & Validation

### Data Completeness Requirements

**Minimum Data for Accurate Metrics**:
- **TRAs Created**: ≥5 TRAs for meaningful trends
- **LMRAs Executed**: ≥10 sessions for statistical significance
- **Average Risk Score**: ≥3 approved TRAs
- **Compliance Rate**: ≥10 TRAs for percentage accuracy
- **Time to Approval**: ≥5 approved TRAs
- **User Activation**: ≥5 users for meaningful rate

### Data Validation Rules

1. **Timestamp Validation**: All dates must be valid and in correct order
2. **Score Validation**: Risk scores must be within Kinney & Wiruth ranges
3. **Status Validation**: TRA status must be valid enum value
4. **Relationship Validation**: All foreign keys must reference existing documents

### Handling Edge Cases

**No Data Available**:
- Display: "Insufficient data" message
- Value: 0 or null
- Status: "N/A"

**Outliers**:
- Risk scores >10,000: Flag for review
- Approval times >30 days: Exclude from average (likely abandoned)
- Users with >1000 TRAs: May be test accounts

**Incomplete Periods**:
- Current month: Show "Month to date" label
- Partial data: Indicate data completeness percentage

---

## API Integration

### Calculation Endpoints

**Calculate All KPIs**:
```typescript
POST /api/analytics/kpis/calculate
Body: {
  organizationId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;  // ISO date
  endDate?: string;    // ISO date
  projectId?: string;  // Optional filter
  includePreviousPeriod?: boolean;
}
Response: KPIDashboard
```

**Calculate Individual KPI**:
```typescript
POST /api/analytics/kpis/{metricType}
// metricType: tras_created | lmras_executed | average_risk_score | compliance_rate | time_to_approval | user_activation_rate
```

### Usage Example

```typescript
import { calculateKPIDashboard, calculateCurrentMonthKPIs } from '@/lib/analytics/kpi-calculator';

// Calculate all KPIs for current month
const result = await calculateCurrentMonthKPIs('org-123', true);

if (result.success) {
  const dashboard = result.metric;
  console.log(`Overall Health: ${dashboard.overallHealthScore}%`);
  console.log(`TRAs Created: ${dashboard.trasCreated.value}`);
  console.log(`Compliance Rate: ${dashboard.complianceRate.value}%`);
}
```

---

## Performance Considerations

### Query Optimization

**Indexed Fields** (Required):
- `organizations/{orgId}/tras`: `createdAt`, `approvedAt`, `status`, `isActive`
- `organizations/{orgId}/lmraSessions`: `startedAt`, `projectId`, `performedBy`
- `organizations/{orgId}/users`: `createdAt`, `role`, `isActive`

**Composite Indexes**:
```javascript
// Firestore composite indexes
tras: [
  ['organizationId', 'createdAt'],
  ['organizationId', 'status', 'isActive'],
  ['organizationId', 'projectId', 'createdAt']
]
```

### Caching Strategy

**Cache Duration**:
- **Real-time metrics**: 5 minutes
- **Daily metrics**: 1 hour
- **Monthly metrics**: 24 hours
- **Historical data**: 7 days

**Cache Keys**:
```
kpi:{orgId}:{metricType}:{period}:{startDate}:{endDate}
```

### Performance Targets

- **Single KPI Calculation**: <2 seconds
- **Full Dashboard**: <10 seconds
- **Historical Trends** (12 months): <30 seconds

---

## Monitoring & Alerts

### Metric Health Checks

**Daily Automated Checks**:
- Verify all KPIs calculated successfully
- Check for data anomalies (sudden spikes/drops)
- Validate calculation times within limits
- Ensure cache hit rates >80%

### Alert Configuration

**Sentry Integration**:
```typescript
// Alert on calculation failures
if (!result.success) {
  Sentry.captureException(new Error(`KPI calculation failed: ${result.error}`));
}

// Alert on slow calculations
if (result.calculationTime > 5000) {
  Sentry.captureMessage(`Slow KPI calculation: ${result.calculationTime}ms`);
}
```

### Runbook References

- **High Error Rate**: See [`docs/runbooks/high-error-rate.md`](../runbooks/high-error-rate.md)
- **Slow Queries**: See [`docs/deployment/03-performance-guide.md`](../deployment/03-performance-guide.md)
- **Data Inconsistencies**: See [`docs/backend/03-database-management.md`](../backend/03-database-management.md)

---

## Future Enhancements

### Planned Metrics (Phase 2)

1. **Customer Lifetime Value (CLV)**: Revenue per organization
2. **Net Promoter Score (NPS)**: User satisfaction
3. **Feature Adoption Rate**: Usage of specific features
4. **Mobile vs Desktop Usage**: Platform preference
5. **Offline Usage Rate**: PWA offline functionality usage

### Advanced Analytics

1. **Predictive Analytics**: Forecast future KPI values
2. **Anomaly Detection**: Automatic detection of unusual patterns
3. **Cohort Analysis**: Track user cohorts over time
4. **A/B Testing**: Compare feature variants
5. **Custom Metrics**: Organization-specific KPIs

### Visualization Enhancements

1. **Interactive Charts**: Drill-down capabilities
2. **Heatmaps**: Risk distribution by project/time
3. **Trend Lines**: Regression analysis
4. **Comparative Views**: Benchmark against industry
5. **Export Options**: PDF, Excel, CSV

---

## Appendix

### Glossary

- **KPI**: Key Performance Indicator
- **TRA**: Task Risk Analysis
- **LMRA**: Last Minute Risk Analysis
- **VCA**: VCA (Dutch safety certification)
- **Kinney & Wiruth**: Risk assessment methodology
- **Compliance**: Meeting regulatory and internal standards

### References

- **Firestore Data Model**: [`FIRESTORE_DATA_MODEL.md`](../../FIRESTORE_DATA_MODEL.md)
- **Type Definitions**: [`web/src/lib/types/metrics.ts`](../../web/src/lib/types/metrics.ts)
- **Calculator Implementation**: [`web/src/lib/analytics/kpi-calculator.ts`](../../web/src/lib/analytics/kpi-calculator.ts)
- **Testing Strategy**: [`TESTING_STRATEGY.md`](../../TESTING_STRATEGY.md)

### Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-03 | 1.0 | Initial KPI catalog creation | Roo (Code Mode) |

---

**Document Status**: ✅ Complete  
**Review Status**: Pending stakeholder review  
**Next Review**: 2025-11-03 (Monthly)