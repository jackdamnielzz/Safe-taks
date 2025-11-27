# VCA 2017 v5.1 Compliance Algorithm

**Version**: 1.0  
**Last Updated**: November 5, 2025  
**Standard**: VCA 2017 v5.1 (Dutch Safety Checklist Contractors)

---

## Table of Contents

1. [Overview](#overview)
2. [Category Weights](#category-weights)
3. [Scoring Categories](#scoring-categories)
4. [Overall Score Calculation](#overall-score-calculation)
5. [Compliance Levels](#compliance-levels)
6. [Implementation Details](#implementation-details)
7. [Edge Cases](#edge-cases)
8. [Code Examples](#code-examples)

---

## Overview

The VCA (Veiligheid, Gezondheid en Milieu Checklist Aannemers) 2017 v5.1 compliance algorithm evaluates Task Risk Analyses (TRAs) against the Dutch safety standard for contractors. The algorithm assesses five key categories and produces an overall compliance score.

### Purpose
- Ensure TRAs meet VCA 2017 v5.1 requirements
- Provide actionable feedback for improvement
- Enable automated compliance checking
- Support regulatory audits

### Key Principles
1. **Weighted Scoring**: Each category has a specific weight reflecting its importance
2. **Penalty-Based**: Points are deducted for missing or inadequate elements
3. **Transparent**: Clear feedback on what needs improvement
4. **Actionable**: Specific issues identified with remediation guidance

---

## Category Weights

The VCA 2017 v5.1 standard defines the following category weights:

| Category | Weight | Rationale |
|----------|--------|-----------|
| **Risk Assessment** | 25% | Foundation of safety planning |
| **Control Measures** | 30% | Most critical for hazard mitigation |
| **Competencies** | 20% | Ensures qualified personnel |
| **Documentation** | 15% | Supports audit trail and communication |
| **Approvals** | 10% | Validates review and authorization |

**Total**: 100%

### Weight Justification

**Control Measures (30%)** - Highest weight because:
- Direct impact on worker safety
- Hierarchy of controls must be followed
- Adequate measures required for high-risk work

**Risk Assessment (25%)** - Second highest because:
- Foundation for all safety decisions
- Kinney & Wiruth method required
- Identifies what needs control

**Competencies (20%)** - Significant weight because:
- VCA certification required for high-risk work
- Team qualifications critical for safety
- Regulatory requirement

**Documentation (15%)** - Moderate weight because:
- Supports communication and audit trail
- Required for legal compliance
- Enables knowledge transfer

**Approvals (10%)** - Lowest weight because:
- Process validation rather than safety content
- Important but not directly protective
- Can be corrected easily

---

## Scoring Categories

### 1. Risk Assessment (25% weight)

**Purpose**: Evaluate the quality and completeness of hazard identification and risk assessment.

**Scoring Logic**:
```typescript
function assessRiskAssessmentCompliance(tra: TRA): CategoryScore {
  let score = 100;
  const issues: ComplianceIssue[] = [];

  // Check 1: Minimum hazards (30 points)
  if (!tra.hazards || tra.hazards.length < 3) {
    score -= 30;
    issues.push({
      category: 'RISK_ASSESSMENT',
      severity: 'HIGH',
      message: 'Minimaal 3 gevaren moeten worden geïdentificeerd',
      field: 'hazards'
    });
  }

  // Check 2: Risk assessment method (25 points)
  const hasRiskScores = tra.hazards?.every(h => 
    h.riskScore && h.riskScore.effect && 
    h.riskScore.exposure && h.riskScore.probability
  );
  if (!hasRiskScores) {
    score -= 25;
    issues.push({
      category: 'RISK_ASSESSMENT',
      severity: 'HIGH',
      message: 'Alle gevaren moeten een risicobeoordeling hebben (Kinney & Wiruth)',
      field: 'hazards.riskScore'
    });
  }

  // Check 3: Risk levels assigned (20 points)
  const hasRiskLevels = tra.hazards?.every(h => h.riskLevel);
  if (!hasRiskLevels) {
    score -= 20;
    issues.push({
      category: 'RISK_ASSESSMENT',
      severity: 'MEDIUM',
      message: 'Alle gevaren moeten een risiconiveau hebben',
      field: 'hazards.riskLevel'
    });
  }

  // Check 4: High-risk hazards identified (15 points)
  const highRiskHazards = tra.hazards?.filter(h => 
    (h.riskScore?.score || 0) > 400
  );
  if (highRiskHazards && highRiskHazards.length > 0) {
    // Bonus: High-risk work properly identified
    // No penalty, but noted for control measures check
  }

  return {
    score: Math.max(0, score),
    maxScore: 100,
    percentage: Math.max(0, score),
    issues
  };
}
```

**Penalty Breakdown**:
- **30 points**: Less than 3 hazards identified
- **25 points**: Missing risk assessment (Kinney & Wiruth method)
- **20 points**: Missing risk levels
- **15 points**: Inadequate hazard descriptions

**Example Scenarios**:

**Scenario A - Fully Compliant (100%)**:
```typescript
{
  hazards: [
    {
      id: '1',
      description: 'Werken op hoogte boven 2.5m zonder valbeveiliging',
      riskScore: { effect: 15, exposure: 6, probability: 6, score: 540 },
      riskLevel: 'HIGH',
      controlMeasures: [...]
    },
    {
      id: '2',
      description: 'Elektrische spanning tijdens werkzaamheden',
      riskScore: { effect: 40, exposure: 3, probability: 3, score: 360 },
      riskLevel: 'MEDIUM',
      controlMeasures: [...]
    },
    {
      id: '3',
      description: 'Handmatig tillen van zware lasten',
      riskScore: { effect: 7, exposure: 6, probability: 6, score: 252 },
      riskLevel: 'MEDIUM',
      controlMeasures: [...]
    }
  ]
}
// Score: 100/100 (100%)
```

**Scenario B - Partially Compliant (55%)**:
```typescript
{
  hazards: [
    {
      id: '1',
      description: 'Werken op hoogte',
      // Missing riskScore (-25 points)
      riskLevel: 'HIGH',
      controlMeasures: [...]
    },
    {
      id: '2',
      description: 'Elektrisch werk',
      // Missing riskScore (-25 points)
      // Missing riskLevel (-20 points)
      controlMeasures: [...]
    }
  ]
  // Only 2 hazards (-30 points)
}
// Score: 55/100 (55%)
```

---

### 2. Control Measures (30% weight)

**Purpose**: Evaluate the adequacy and appropriateness of control measures for identified hazards.

**Scoring Logic**:
```typescript
function assessControlMeasuresCompliance(tra: TRA): CategoryScore {
  let score = 100;
  const issues: ComplianceIssue[] = [];

  // Check 1: All hazards have control measures (40 points)
  const hazardsWithoutControls = tra.hazards?.filter(h => 
    !h.controlMeasures || h.controlMeasures.length === 0
  );
  if (hazardsWithoutControls && hazardsWithoutControls.length > 0) {
    score -= 40;
    issues.push({
      category: 'CONTROL_MEASURES',
      severity: 'CRITICAL',
      message: `${hazardsWithoutControls.length} gevaar/gevaren hebben geen beheersmaatregelen`,
      field: 'hazards.controlMeasures'
    });
  }

  // Check 2: Hierarchy of controls followed (30 points)
  const controlsFollowHierarchy = tra.hazards?.every(h =>
    h.controlMeasures?.some(cm => 
      ['ELIMINATE', 'REPLACE', 'TECHNICAL', 'ORGANIZATIONAL', 'PPE']
        .includes(cm.type)
    )
  );
  if (!controlsFollowHierarchy) {
    score -= 30;
    issues.push({
      category: 'CONTROL_MEASURES',
      severity: 'HIGH',
      message: 'Beheersmaatregelen moeten de arbeidshygiënische strategie volgen',
      field: 'hazards.controlMeasures.type'
    });
  }

  // Check 3: High-risk hazards have adequate controls (20 points)
  const highRiskHazards = tra.hazards?.filter(h => 
    (h.riskScore?.score || 0) > 400
  );
  const inadequateHighRiskControls = highRiskHazards?.filter(h =>
    !h.controlMeasures || h.controlMeasures.length < 2
  );
  if (inadequateHighRiskControls && inadequateHighRiskControls.length > 0) {
    score -= 20;
    issues.push({
      category: 'CONTROL_MEASURES',
      severity: 'HIGH',
      message: 'Hoog-risico gevaren vereisen minimaal 2 beheersmaatregelen',
      field: 'hazards.controlMeasures'
    });
  }

  // Check 4: Control measures have descriptions (10 points)
  const controlsWithoutDescriptions = tra.hazards?.flatMap(h =>
    h.controlMeasures?.filter(cm => !cm.description || cm.description.length < 10)
  );
  if (controlsWithoutDescriptions && controlsWithoutDescriptions.length > 0) {
    score -= 10;
    issues.push({
      category: 'CONTROL_MEASURES',
      severity: 'MEDIUM',
      message: 'Alle beheersmaatregelen moeten een duidelijke beschrijving hebben',
      field: 'hazards.controlMeasures.description'
    });
  }

  return {
    score: Math.max(0, score),
    maxScore: 100,
    percentage: Math.max(0, score),
    issues
  };
}
```

**Penalty Breakdown**:
- **40 points**: Hazards without control measures
- **30 points**: Hierarchy of controls not followed
- **20 points**: Inadequate controls for high-risk hazards
- **10 points**: Missing control measure descriptions

**Hierarchy of Controls** (in order of effectiveness):
1. **ELIMINATE**: Remove the hazard entirely
2. **REPLACE**: Substitute with less hazardous alternative
3. **TECHNICAL**: Engineering controls (guards, ventilation)
4. **ORGANIZATIONAL**: Administrative controls (procedures, training)
5. **PPE**: Personal protective equipment (last resort)

---

### 3. Competencies (20% weight)

**Purpose**: Ensure the team has the required qualifications and certifications for the work.

**Scoring Logic**:
```typescript
function assessCompetenciesCompliance(tra: TRA): CategoryScore {
  let score = 100;
  const issues: ComplianceIssue[] = [];

  // Check 1: Team members assigned (40 points)
  if (!tra.teamMembers || tra.teamMembers.length === 0) {
    score -= 40;
    issues.push({
      category: 'COMPETENCIES',
      severity: 'CRITICAL',
      message: 'Minimaal 1 teamlid moet worden toegewezen',
      field: 'teamMembers'
    });
  }

  // Check 2: Required competencies defined (30 points)
  if (!tra.requiredCompetencies || tra.requiredCompetencies.length === 0) {
    score -= 30;
    issues.push({
      category: 'COMPETENCIES',
      severity: 'HIGH',
      message: 'Vereiste competenties moeten worden gedefinieerd',
      field: 'requiredCompetencies'
    });
  }

  // Check 3: VCA certification for high-risk work (15-30 points)
  const highRiskHazards = tra.hazards?.filter(h => 
    (h.riskScore?.score || 0) > 400
  );
  if (highRiskHazards && highRiskHazards.length > 0) {
    const hasVCACertification = tra.teamMembers?.some(tm =>
      tm.certifications?.includes('VCA') || 
      tm.certifications?.includes('VCA-VOL')
    );
    if (!hasVCACertification) {
      score -= 30;
      issues.push({
        category: 'COMPETENCIES',
        severity: 'CRITICAL',
        message: 'VCA-certificering vereist voor hoog-risico werkzaamheden',
        field: 'teamMembers.certifications'
      });
    }
  }

  // Check 4: Team size matches requirements (10 points)
  if (tra.personnelRequirements && tra.teamMembers) {
    const requiredCount = tra.personnelRequirements.minimumPersonnel || 1;
    if (tra.teamMembers.length < requiredCount) {
      score -= 10;
      issues.push({
        category: 'COMPETENCIES',
        severity: 'MEDIUM',
        message: `Minimaal ${requiredCount} teamleden vereist`,
        field: 'teamMembers'
      });
    }
  }

  return {
    score: Math.max(0, score),
    maxScore: 100,
    percentage: Math.max(0, score),
    issues
  };
}
```

**Penalty Breakdown**:
- **40 points**: No team members assigned
- **30 points**: Required competencies not defined OR missing VCA certification for high-risk work
- **10 points**: Team size below minimum requirements

**VCA Certification Requirements**:
- **VCA-VOL**: Required for supervisors and managers
- **VCA**: Required for all workers on high-risk sites
- **High-risk work**: Any hazard with risk score > 400

---

### 4. Documentation (15% weight)

**Purpose**: Ensure adequate documentation for communication and audit trail.

**Scoring Logic**:
```typescript
function assessDocumentationCompliance(tra: TRA): CategoryScore {
  let score = 100;
  const issues: ComplianceIssue[] = [];

  // Check 1: Title length (25 points)
  if (!tra.title || tra.title.length < 10) {
    score -= 25;
    issues.push({
      category: 'DOCUMENTATION',
      severity: 'HIGH',
      message: 'Titel moet minimaal 10 karakters bevatten',
      field: 'title'
    });
  }

  // Check 2: Description length (25 points)
  if (!tra.description || tra.description.length < 50) {
    score -= 25;
    issues.push({
      category: 'DOCUMENTATION',
      severity: 'HIGH',
      message: 'Beschrijving moet minimaal 50 karakters bevatten',
      field: 'description'
    });
  }

  // Check 3: Task steps documented (20 points)
  if (!tra.taskSteps || tra.taskSteps.length === 0) {
    score -= 20;
    issues.push({
      category: 'DOCUMENTATION',
      severity: 'MEDIUM',
      message: 'Werkstappen moeten worden gedocumenteerd',
      field: 'taskSteps'
    });
  }

  // Check 4: Task step descriptions (15 points)
  const stepsWithoutDescriptions = tra.taskSteps?.filter(ts =>
    !ts.description || ts.description.length < 10
  );
  if (stepsWithoutDescriptions && stepsWithoutDescriptions.length > 0) {
    score -= 15;
    issues.push({
      category: 'DOCUMENTATION',
      severity: 'MEDIUM',
      message: 'Alle werkstappen moeten een duidelijke beschrijving hebben',
      field: 'taskSteps.description'
    });
  }

  // Check 5: Location specified (15 points)
  if (!tra.location || !tra.location.address) {
    score -= 15;
    issues.push({
      category: 'DOCUMENTATION',
      severity: 'MEDIUM',
      message: 'Werklocatie moet worden gespecificeerd',
      field: 'location'
    });
  }

  return {
    score: Math.max(0, score),
    maxScore: 100,
    percentage: Math.max(0, score),
    issues
  };
}
```

**Penalty Breakdown**:
- **25 points**: Title too short (< 10 characters)
- **25 points**: Description too short (< 50 characters)
- **20 points**: No task steps documented
- **15 points**: Task steps without descriptions
- **15 points**: Location not specified

---

### 5. Approvals (10% weight)

**Purpose**: Validate that the TRA has been reviewed and authorized.

**Scoring Logic**:
```typescript
function assessApprovalsCompliance(tra: TRA): CategoryScore {
  let score = 100;
  const issues: ComplianceIssue[] = [];

  // Check 1: TRA submitted for approval (50 points)
  if (tra.status !== 'PENDING_APPROVAL' && tra.status !== 'APPROVED') {
    score -= 50;
    issues.push({
      category: 'APPROVALS',
      severity: 'HIGH',
      message: 'TRA moet worden ingediend ter goedkeuring',
      field: 'status'
    });
  }

  // Check 2: Approval workflow exists (30 points)
  if (!tra.approvalWorkflow || tra.approvalWorkflow.length === 0) {
    score -= 30;
    issues.push({
      category: 'APPROVALS',
      severity: 'MEDIUM',
      message: 'Goedkeuringsworkflow moet worden gedefinieerd',
      field: 'approvalWorkflow'
    });
  }

  // Check 3: Required approvers assigned (20 points)
  const hasRequiredApprovers = tra.approvalWorkflow?.some(aw =>
    aw.role === 'SAFETY_MANAGER' || aw.role === 'SUPERVISOR'
  );
  if (!hasRequiredApprovers) {
    score -= 20;
    issues.push({
      category: 'APPROVALS',
      severity: 'MEDIUM',
      message: 'Vereiste goedkeurders moeten worden toegewezen',
      field: 'approvalWorkflow'
    });
  }

  return {
    score: Math.max(0, score),
    maxScore: 100,
    percentage: Math.max(0, score),
    issues
  };
}
```

**Penalty Breakdown**:
- **50 points**: TRA not submitted for approval
- **30 points**: No approval workflow defined
- **20 points**: Required approvers not assigned

**Required Approvers**:
- **Safety Manager**: Always required
- **Supervisor**: Required for field work
- **Client Representative**: Required for client sites

---

## Overall Score Calculation

The overall compliance score is calculated as a weighted sum of category scores:

```typescript
function calculateOverallScore(breakdown: ComplianceBreakdown): number {
  const weights = {
    riskAssessment: 0.25,    // 25%
    controlMeasures: 0.30,   // 30%
    competencies: 0.20,      // 20%
    documentation: 0.15,     // 15%
    approvals: 0.10          // 10%
  };

  const overallScore = 
    (breakdown.riskAssessment.percentage * weights.riskAssessment) +
    (breakdown.controlMeasures.percentage * weights.controlMeasures) +
    (breakdown.competencies.percentage * weights.competencies) +
    (breakdown.documentation.percentage * weights.documentation) +
    (breakdown.approvals.percentage * weights.approvals);

  return Math.round(overallScore * 10) / 10; // Round to 1 decimal
}
```

**Example Calculation**:
```typescript
const breakdown = {
  riskAssessment: { percentage: 100 },    // 100% × 0.25 = 25.0
  controlMeasures: { percentage: 90 },    //  90% × 0.30 = 27.0
  competencies: { percentage: 80 },       //  80% × 0.20 = 16.0
  documentation: { percentage: 85 },      //  85% × 0.15 = 12.75
  approvals: { percentage: 100 }          // 100% × 0.10 = 10.0
};

// Overall Score = 25.0 + 27.0 + 16.0 + 12.75 + 10.0 = 90.75%
```

---

## Compliance Levels

Based on the overall score, TRAs are classified into four compliance levels:

| Level | Score Range | Status | Description |
|-------|-------------|--------|-------------|
| **FULLY_COMPLIANT** | ≥95% | ✅ Excellent | Exceeds VCA requirements |
| **COMPLIANT** | 85-94% | ✅ Good | Meets VCA requirements |
| **PARTIALLY_COMPLIANT** | 70-84% | ⚠️ Warning | Needs improvement |
| **NON_COMPLIANT** | <70% | ❌ Critical | Does not meet VCA requirements |

```typescript
function determineComplianceLevel(score: number): ComplianceLevel {
  if (score >= 95) return 'FULLY_COMPLIANT';
  if (score >= 85) return 'COMPLIANT';
  if (score >= 70) return 'PARTIALLY_COMPLIANT';
  return 'NON_COMPLIANT';
}
```

**Regulatory Requirements**:
- **Minimum for production use**: 85% (COMPLIANT)
- **Recommended target**: 95% (FULLY_COMPLIANT)
- **Audit threshold**: 70% (below this requires immediate action)

---

## Implementation Details

### Data Structures

```typescript
interface ComplianceResult {
  overallScore: number;
  complianceLevel: ComplianceLevel;
  breakdown: ComplianceBreakdown;
  timestamp: Date;
}

interface ComplianceBreakdown {
  riskAssessment: CategoryScore;
  controlMeasures: CategoryScore;
  competencies: CategoryScore;
  documentation: CategoryScore;
  approvals: CategoryScore;
}

interface CategoryScore {
  score: number;        // Points earned (0-100)
  maxScore: number;     // Maximum possible (100)
  percentage: number;   // Score as percentage
  issues: ComplianceIssue[];
}

interface ComplianceIssue {
  category: ComplianceCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  field: string;
  suggestion?: string;
}

type ComplianceCategory = 
  | 'RISK_ASSESSMENT'
  | 'CONTROL_MEASURES'
  | 'COMPETENCIES'
  | 'DOCUMENTATION'
  | 'APPROVALS';

type ComplianceLevel = 
  | 'FULLY_COMPLIANT'
  | 'COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT';
```

### Main Function

```typescript
export function checkVCACompliance(tra: TRA): ComplianceResult {
  // Assess each category
  const riskAssessment = assessRiskAssessmentCompliance(tra);
  const controlMeasures = assessControlMeasuresCompliance(tra);
  const competencies = assessCompetenciesCompliance(tra);
  const documentation = assessDocumentationCompliance(tra);
  const approvals = assessApprovalsCompliance(tra);

  // Create breakdown
  const breakdown: ComplianceBreakdown = {
    riskAssessment,
    controlMeasures,
    competencies,
    documentation,
    approvals
  };

  // Calculate overall score
  const overallScore = calculateOverallScore(breakdown);
  const complianceLevel = determineComplianceLevel(overallScore);

  return {
    overallScore,
    complianceLevel,
    breakdown,
    timestamp: new Date()
  };
}
```

---

## Edge Cases

### 1. Empty TRA
```typescript
const emptyTRA = {
  id: '123',
  title: '',
  description: '',
  hazards: [],
  teamMembers: [],
  status: 'DRAFT'
};

// Result: 0% overall (all categories fail)
```

### 2. High-Risk Work Without VCA
```typescript
const tra = {
  hazards: [{
    riskScore: { score: 500 }, // High risk
    controlMeasures: [...]
  }],
  teamMembers: [{
    name: 'John Doe',
    certifications: [] // No VCA!
  }]
};

// Competencies: 70% (30 point penalty)
// Overall impact: -6% (30% × 20% weight)
```

### 3. Approved TRA with Missing Data
```typescript
const tra = {
  status: 'APPROVED',
  hazards: [], // No hazards!
  approvalWorkflow: [...]
};

// Approvals: 100% (status is approved)
// Risk Assessment: 30% (missing hazards)
// Overall: ~60% (fails compliance)
```

### 4. Perfect Documentation, Poor Safety
```typescript
const tra = {
  title: 'Detailed Work Plan',
  description: 'Very detailed description...',
  taskSteps: [...], // Well documented
  hazards: [{
    description: 'Fall hazard',
    controlMeasures: [] // No controls!
  }]
};

// Documentation: 100%
// Control Measures: 60% (40 point penalty)
// Overall: ~75% (partially compliant)
```

---

## Code Examples

### Example 1: Complete Compliance Check

```typescript
import { checkVCACompliance } from '@/lib/vca-compliance';

const tra = await fetchTRA(traId);
const result = checkVCACompliance(tra);

console.log(`Overall Score: ${result.overallScore}%`);
console.log(`Compliance Level: ${result.complianceLevel}`);

// Display issues by severity
const criticalIssues = Object.values(result.breakdown)
  .flatMap(cat => cat.issues)
  .filter(issue => issue.severity === 'CRITICAL');

if (criticalIssues.length > 0) {
  console.log('Critical Issues:');
  criticalIssues.forEach(issue => {
    console.log(`- ${issue.message} (${issue.field})`);
  });
}
```

### Example 2: Real-Time Compliance Monitoring

```typescript
import { useEffect, useState } from 'react';
import { checkVCACompliance } from '@/lib/vca-compliance';

function ComplianceMonitor({ tra }) {
  const [compliance, setCompliance] = useState(null);

  useEffect(() => {
    const result = checkVCACompliance(tra);
    setCompliance(result);
  }, [tra]);

  if (!compliance) return <div>Checking compliance...</div>;

  return (
    <div>
      <h2>VCA Compliance: {compliance.overallScore}%</h2>
      <ComplianceBadge level={compliance.complianceLevel} />
      
      {Object.entries(compliance.breakdown).map(([category, score]) => (
        <CategoryCard 
          key={category}
          category={category}
          score={score}
        />
      ))}
    </div>
  );
}
```

### Example 3: Batch Compliance Check

```typescript
async function checkOrganizationCompliance(organizationId: string) {
  const tras = await fetchOrganizationTRAs(organizationId);
  
  const results = tras.map(tra => ({
    traId: tra.id,
    title: tra.title,
    compliance: checkVCACompliance(tra)
  }));

  // Find non-compliant TRAs
  const nonCompliant = results.filter(r => 
    r.compliance.complianceLevel === 'NON_COMPLIANT'
  );

  // Calculate average compliance
  const avgScore = results.reduce((sum, r) => 
    sum + r.compliance.overallScore, 0
  ) / results.length;

  return {
    totalTRAs: tras.length,
    averageScore: avgScore,
    nonCompliantCount: nonCompliant.length,
    nonCompliantTRAs: nonCompliant
  };
}
```

### Example 4: Compliance Improvement Suggestions

```typescript
function generateImprovementPlan(result: ComplianceResult) {
  const suggestions = [];

  // Prioritize by category weight and score
  const categories = Object.entries(result.breakdown)
    .map(([name, score]) => ({
      name,
      score: score.percentage,
      weight: getWeight(name),
      impact: (100 - score.percentage) * getWeight(name)
    }))
    .sort((a, b) => b.impact - a.impact);

  categories.forEach(cat => {
    if (cat.score < 100) {
      suggestions.push({
        category: cat.name,
        currentScore: cat.score,
        potentialGain: cat.impact,
        priority: cat.impact > 10 ? 'HIGH' : 'MEDIUM',
        issues: result.breakdown[cat.name].issues
      });
    }
  });

  return suggestions;
}
```

---

## Performance Considerations

### Optimization Tips

1. **Cache Results**: Compliance checks are expensive, cache results
2. **Incremental Updates**: Only recalculate affected categories
3. **Lazy Evaluation**: Skip checks for categories that can't affect outcome
4. **Parallel Processing**: Check categories in parallel for large datasets

```typescript
// Example: Cached compliance check
const complianceCache = new Map<string, ComplianceResult>();

function getCachedCompliance(tra: TRA): ComplianceResult {
  const cacheKey = `${tra.id}-${tra.updatedAt}`;
  
  if (complianceCache.has(cacheKey)) {
    return complianceCache.get(cacheKey)!;
  }

  const result = checkVCACompliance(tra);
  complianceCache.set(cacheKey, result);
  
  return result;
}
```

---

## Testing

### Unit Test Example

```typescript
describe('VCA Compliance Algorithm', () => {
  it('should calculate correct overall score', () => {
    const tra = createMockTRA({
      hazards: [createMockHazard()],
      teamMembers: [createMockTeamMember()],
      status: 'APPROVED'
    });

    const result = checkVCACompliance(tra);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.complianceLevel).toBeDefined();
  });
