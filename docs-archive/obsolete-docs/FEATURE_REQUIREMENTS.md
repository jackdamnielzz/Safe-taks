# SafeWork Pro - Detailed Feature Requirements
## Based on TRA/LMRA Domain Knowledge

**Document Version**: 1.0  
**Last Updated**: September 29, 2025  
**Status**: Ready for Development  
**Dependencies**: Task 1.2 (Market Research), info.md (Domain Knowledge), MVP_SCOPE.md

---

## Table of Contents

1. [Overview](#overview)
2. [Domain Context](#domain-context)
3. [Core TRA Features](#core-tra-features)
4. [LMRA Execution Features](#lmra-execution-features)
5. [Collaboration & Approval Features](#collaboration--approval-features)
6. [Compliance & Audit Features](#compliance--audit-features)
7. [Reporting & Analytics Features](#reporting--analytics-features)
8. [User Management Features](#user-management-features)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [Technical Requirements](#technical-requirements)

---

## Overview

### Purpose
This document translates TRA (Taak Risico Analyse) and LMRA (Last Minute Risk Analysis) domain knowledge into detailed feature requirements, user stories, and acceptance criteria for SafeWork Pro.

### Target Users
1. **Safety Managers**: Create and manage TRAs, oversee compliance
2. **Supervisors**: Review TRAs, coordinate field work
3. **Field Workers**: Execute LMRAs, document safety conditions
4. **Administrators**: Manage organization, users, and billing

### Key Domain Requirements (from info.md)
- **Proactive Risk Management**: Prevent incidents through systematic analysis
- **VCA Compliance**: Meet Dutch/European safety standards
- **Kinney & Wiruth Methodology**: Scientific risk calculation (Effect × Exposure × Probability)
- **Hierarchical Control Measures**: Elimination > Substitution > Engineering > Administrative > PPE
- **Legal Compliance**: Part of mandatory RI&E (Risico-Inventarisatie & Evaluatie)

---

## Domain Context

### What is a TRA? (Task Risk Analysis)
A TRA is a **systematic process** to:
1. Identify potential hazards in a specific task
2. Assess risks using recognized methodology (Kinney & Wiruth)
3. Determine appropriate control measures
4. Document findings for approval and execution

**Legal Requirement**: Mandatory under Dutch Arbowet (Working Conditions Act) as part of RI&E.

**Key Characteristics**:
- Performed **before** task execution
- Required for complex, risky, or non-routine work
- Valid for specific period (typically 6-12 months per VCA)
- Must be reviewed after incidents or changes
- Requires approval from qualified safety personnel

### What is an LMRA? (Last Minute Risk Analysis)
An LMRA is a **pre-task safety check** performed:
1. Immediately before starting work (hence "Last Minute")
2. At the actual work location
3. By the people who will do the work
4. To verify actual conditions match TRA assumptions

**Purpose**: Bridge between planning (TRA) and execution, catching unforeseen hazards.

**Key Components**:
- Environmental condition verification
- Team competency confirmation
- Equipment availability check
- Stop-work authority if unsafe

---

## Core TRA Features

### Feature 1: TRA Creation Wizard

**Epic**: As a Safety Manager, I need a guided process to create comprehensive TRAs so that I can systematically identify and assess all relevant risks.

#### User Stories

**US-1.1: Project and Template Selection**
```
As a Safety Manager
I want to select a project and choose an appropriate template
So that I can quickly start a TRA with relevant pre-configured hazards

Acceptance Criteria:
✓ System displays all active projects in my organization
✓ System recommends templates based on project type/industry
✓ Templates include VCA-compliant defaults for common scenarios
✓ I can preview template contents before selection
✓ I can choose to start from blank TRA if no template fits
✓ Selected template pre-populates task steps and common hazards
✓ Auto-save activates immediately upon template selection

Technical Notes:
- Templates stored in: organizations/{orgId}/traTemplates/
- Minimum 5-10 VCA-compliant templates for MVP
- Template versioning for updates without breaking existing TRAs
```

**US-1.2: Task Breakdown into Steps**
```
As a Safety Manager
I want to break down complex tasks into sequential steps
So that I can analyze risks at each stage of work

Acceptance Criteria:
✓ I can add unlimited task steps with descriptions
✓ Each step includes: description, duration, required personnel, location
✓ Steps are numbered automatically and can be reordered
✓ I can copy steps from previous TRAs or templates
✓ System validates that at least one step is defined
✓ Auto-save preserves work every 10 seconds
✓ Undo/redo functionality for step changes

Domain Rules:
- Logical, chronological order (setup → execution → cleanup)
- Each step must be granular enough for hazard identification
- Duration estimates help with LMRA scheduling
```

**US-1.3: Hazard Identification per Step**
```
As a Safety Manager
I want to identify all potential hazards for each task step
So that no critical safety risks are overlooked

Acceptance Criteria:
✓ I can browse hazard library categorized by type (electrical, mechanical, chemical, etc.)
✓ Search functionality finds hazards by keyword in Dutch/English
✓ System suggests relevant hazards based on task description (template-based)
✓ I can add custom hazards not in library
✓ Each hazard includes: description, category, source (template/library/custom)
✓ Hazards can be linked to multiple steps if applicable
✓ Visual indicators show step completeness (hazards identified)

Hazard Library Requirements (MVP):
- Minimum 100+ common hazards categorized by industry
- Categories: Electrical, Mechanical, Chemical, Biological, Ergonomic, Psychosocial, Fire/Explosion, Environmental
- Searchable by keyword, category, and risk level
- Editable by Safety Managers (organization-specific)
```

**US-1.4: Kinney & Wiruth Risk Assessment**
```
As a Safety Manager
I want to calculate risk scores using the Kinney & Wiruth method
So that I can objectively prioritize risks and comply with VCA standards

Acceptance Criteria:
✓ For each hazard, I select values for Effect (E), Exposure (B), Probability (W)
✓ System provides clear descriptions for each score level
✓ Risk Score automatically calculated: R = E × B × W
✓ Risk Level automatically determined based on score:
  - R > 400: Very High (🔴 Red) - Work cannot proceed
  - R 200-400: High (🟠 Orange) - Immediate action required
  - R 70-200: Substantial (🟡 Yellow) - Action required
  - R 20-70: Possible (🔵 Blue) - Attention needed
  - R < 20: Low (🟢 Green) - Acceptable
✓ Visual color coding matches risk level
✓ Overall TRA risk = highest individual risk
✓ Risk scores recalculated after control measures applied
✓ Historical risk scores preserved in audit trail

Kinney & Wiruth Scale Definitions:

Effect (E) - Potential Consequence:
1 = Minor injury, no lost time
3 = Minor injury, requires first aid
7 = Serious injury, lost time
15 = Very serious injury, permanent disability
40 = Fatality or multiple serious injuries
100 = Catastrophic, multiple fatalities

Exposure (B) - Frequency of Exposure:
0.5 = Rarely (few times per year)
1 = Occasionally (monthly)
2 = Sometimes (weekly)
3 = Regularly (daily)
6 = Frequently (hourly)
10 = Continuously

Probability (W) - Likelihood:
0.1 = Practically impossible
0.2 = Conceivable but unlikely
0.5 = Unlikely but possible
1 = Possible (50/50)
3 = Quite possible
6 = Probable
10 = Very likely/certain

Technical Implementation:
- Risk calculator function in lib/calculations.ts
- Validation: all three scores required before calculation
- Rounding: scores stored as integers for consistency
```

**US-1.5: Control Measures Definition**
```
As a Safety Manager
I want to define control measures following the hierarchy of controls
So that I implement the most effective risk reduction strategies

Acceptance Criteria:
✓ Control measures organized by hierarchy: Elimination > Substitution > Engineering > Administrative > PPE
✓ System recommends control measures from library based on hazard type
✓ Each control measure includes: description, type, responsible person, deadline, verification method
✓ I can assign specific personnel to implement each measure
✓ Multiple control measures can be applied to single hazard
✓ System calculates residual risk after controls applied
✓ Warning if residual risk still above acceptable threshold
✓ PPE requirements clearly specified (type, rating, certification)

Hierarchy of Controls (Arbeidshygiënische Strategie):
1. Elimination (Bronaanpak): Remove hazard entirely
2. Substitution: Replace with safer alternative
3. Engineering Controls (Collectieve maatregelen): Physical barriers, ventilation, guards
4. Administrative Controls: Procedures, training, permits, rotation
5. Personal Protective Equipment (PBM): Last resort only

VCA Compliance Requirements:
- All high-risk hazards must have multiple control layers
- PPE alone is insufficient for high risks
- Control measures must be specific and actionable
- Responsible person must be identified
- Verification method must be defined
```

**US-1.6: TRA Review and Submission**
```
As a Safety Manager
I want to review the complete TRA before submission
So that I can verify completeness and accuracy before approval workflow

Acceptance Criteria:
✓ Summary page shows: overall risk level, total hazards, control measures, team members
✓ Validation checks for completeness:
  - All task steps have hazards identified
  - All hazards have risk assessments
  - All high risks have appropriate control measures
  - Validity period is set (max 12 months per VCA)
  - Required team members/competencies identified
✓ Warning for incomplete sections
✓ Ability to go back to any section for edits
✓ Submission triggers approval workflow
✓ Auto-save preserves draft state
✓ Option to save as draft without submitting

Validation Rules:
- Minimum 1 task step required
- Each step must have at least 1 hazard
- Each hazard must have risk score
- High/Very High risks must have control measures with residual risk < 70
- Validity period required (default 6 months, max 12 months VCA)
```

---

### Feature 2: Industry-Specific Templates

**Epic**: As a Safety Manager, I need pre-configured TRA templates for common scenarios so that I can create TRAs faster with best practices built-in.

#### User Stories

**US-2.1: Template Library**
```
As a Safety Manager
I want to access a library of VCA-compliant TRA templates
So that I can start with proven safety frameworks

Acceptance Criteria:
✓ Template library organized by industry and hazard type
✓ Minimum 5-10 templates available for MVP:
  1. Electrical Work - Construction (Low/High Voltage)
  2. Working at Height (Scaffolding, Ladder Work)
  3. Confined Space Entry
  4. Hot Work (Welding, Cutting, Grinding)
  5. Excavation and Trenching
  6. Heavy Lifting and Crane Operations
  7. Chemical Handling and Storage
  8. Emergency/Rescue Operations
✓ Each template includes: pre-defined task steps, common hazards, recommended controls
✓ Templates marked as VCA-certified where applicable
✓ Usage statistics shown (# times used, average rating)
✓ Preview functionality before selection
✓ Templates can be customized and saved as organization-specific

Template Metadata:
- Template name and description
- Industry/sector applicability
- VCA compliance certification
- Last updated date
- Version number
- Created by (SafeWork Pro or Organization)
```

**US-2.2: Template Customization**
```
As a Safety Manager
I want to customize templates for my organization's specific needs
So that I can maintain consistency while addressing unique requirements

Acceptance Criteria:
✓ I can edit any template field (steps, hazards, controls)
✓ I can save customized version as organization-specific template
✓ Organization templates are private (not shared across organizations)
✓ I can version control organization templates
✓ Changes to base template don't affect my custom versions
✓ I can share templates with other members of my organization
✓ I can export templates for backup/migration

Technical Implementation:
- Base templates: read-only, shared across platform
- Organization templates: organizations/{orgId}/traTemplates/
- Template versioning via version field
- Deep copy on customization to prevent unintended changes
```

**US-2.3: Template Recommendations**
```
As a Safety Manager
I want the system to recommend appropriate templates
So that I don't miss relevant safety considerations

Acceptance Criteria:
✓ System recommends templates based on:
  - Project industry/type
  - Keywords in TRA title/description
  - Previous TRA history in organization
✓ Recommendations ranked by relevance
✓ Each recommendation shows: name, description, match score, preview
✓ I can accept, reject, or preview recommendations
✓ Recommendation logic improves based on usage patterns

Recommendation Algorithm:
- Keyword matching: project name/description → template tags
- Industry matching: organization industry → template industry
- Historical usage: frequently used templates ranked higher
- VCA compliance: certified templates prioritized
```

---

### Feature 3: Hazard Identification Library

**Epic**: As a Safety Manager, I need a comprehensive hazard library so that I can identify all relevant risks systematically.

#### User Stories

**US-3.1: Searchable Hazard Database**
```
As a Safety Manager
I want to search a comprehensive database of workplace hazards
So that I don't overlook critical safety risks

Acceptance Criteria:
✓ Hazard library contains 100+ common hazards for MVP
✓ Search by keyword (Dutch/English)
✓ Filter by category:
  - Electrical (shock, arc flash, burns)
  - Mechanical (crushing, cutting, entanglement)
  - Chemical (inhalation, skin contact, ingestion)
  - Biological (bacteria, viruses, allergens)
  - Physical (noise, vibration, radiation, temperature)
  - Ergonomic (repetitive strain, awkward postures, heavy lifting)
  - Psychosocial (stress, violence, harassment)
  - Fire/Explosion
  - Environmental (weather, terrain, wildlife)
✓ Each hazard includes: description, typical severity, common controls
✓ Visual icons for quick identification
✓ Related hazards shown for consideration

Hazard Data Structure:
{
  id: string,
  name: string,
  description: string,
  category: string,
  subcategory: string,
  typicalSeverity: number, // Effect score
  commonControls: string[],
  relatedHazards: string[],
  industrySpecific: string[], // Construction, Industrial, Offshore, etc.
  vca<br>Relevant: boolean
}
```

**US-3.2: Custom Hazard Creation**
```
As a Safety Manager
I want to add organization-specific hazards
So that I can address unique risks in my workplace

Acceptance Criteria:
✓ I can create custom hazards with all required fields
✓ Custom hazards stored per organization (not shared)
✓ Custom hazards appear alongside standard library in searches
✓ I can edit/delete custom hazards
✓ Custom hazards can reference standard hazards as "related"
✓ Audit trail tracks who created/modified custom hazards

Data Isolation:
- Standard hazards: global, read-only
- Custom hazards: organizations/{orgId}/hazards/
- Search combines both with clear labeling
```

**US-3.3: Hazard Suggestions Based on Context**
```
As a Safety Manager
I want intelligent hazard suggestions based on task description
So that I work more efficiently

Acceptance Criteria:
✓ System suggests hazards based on:
  - Keywords in task step description
  - Selected industry/project type
  - Template hazards (if template used)
  - Historical TRAs in organization
✓ Suggestions ranked by relevance
✓ I can accept/reject suggestions with one click
✓ Accepted suggestions include pre-filled typical severity
✓ Learning: system learns from accepted/rejected suggestions

Suggestion Logic:
- Keyword matching: "electrical" → electrical hazards
- Industry matching: construction project → construction-specific hazards
- Template-based: if template used, suggest template hazards first
- Historical: frequently used hazards in organization
```

---

## LMRA Execution Features

### Feature 4: Mobile LMRA Workflow

**Epic**: As a Field Worker, I need a mobile-optimized LMRA execution process so that I can perform pre-task safety checks efficiently in the field.

#### User Stories

**US-4.1: TRA Selection for LMRA**
```
As a Field Worker
I want to select the appropriate TRA for my task
So that I can execute the correct safety checklist

Acceptance Criteria:
✓ Mobile dashboard shows TRAs assigned to me or my team
✓ TRAs filtered by: today's schedule, my location, my project
✓ Each TRA card shows: title, project, risk level, team members, scheduled time
✓ Visual indicators: overdue, starting soon, in progress
✓ I can search TRAs by title or project
✓ QR code scanning option to quickly find TRA
✓ Offline access to downloaded TRAs

TRA Assignment Logic:
- TRAs assigned to specific users or roles
- Location-based filtering (within 1km radius)
- Time-based filtering (today + next 7 days)
- Team membership (TRAs for my team)
```

**US-4.2: Location Verification**
```
As a Field Worker
I want my work location automatically verified
So that I confirm I'm executing LMRA at the correct site

Acceptance Criteria:
✓ GPS automatically captures current location (lat/long)
✓ System compares current location to TRA designated location
✓ Visual confirmation: ✅ if within acceptable radius (50m), ⚠️ if distant
✓ Manual location override with justification (e.g., GPS inaccurate)
✓ Location accuracy displayed (±Xm GPS)
✓ Privacy controls: location only captured during LMRA, not continuous tracking
✓ Works offline: location cached, verified on sync

Technical Requirements:
- HTML5 Geolocation API for PWA
- Accuracy threshold: ±10m acceptable
- Timeout: 30 seconds for GPS lock
- Fallback: manual location entry if GPS unavailable
```

**US-4.3: Environmental Condition Assessment**
```
As a Field Worker
I want to assess environmental conditions
So that I verify they match TRA assumptions

Acceptance Criteria:
✓ Weather conditions auto-populated via API (temperature, humidity, wind, visibility)
✓ Manual overrides for micro-climate differences
✓ Environmental hazard checklist specific to TRA:
  - Gas levels (if applicable - confined space, chemical work)
  - Noise levels (if applicable - loud machinery)
  - Lighting adequacy
  - Ventilation sufficiency
  - Ground conditions (wet, icy, unstable)
✓ Required checks based on TRA hazards (dynamic checklist)
✓ Photo documentation for unusual conditions
✓ Stop-work trigger if conditions deviate significantly from TRA

Weather API Integration:
- Use OpenWeather or similar API
- Location-based weather (use GPS coordinates)
- Current conditions + 3-hour forecast
- Offline: use last cached weather, mark as "not verified"
```

**US-4.4: Team Competency Verification**
```
As a Field Worker
I want to verify all team members have required competencies
So that only qualified people perform high-risk work

Acceptance Criteria:
✓ Team roster from TRA automatically loaded
✓ Each team member must check-in via app
✓ System verifies: required certifications, training currency, medical clearance
✓ Visual indicators: ✅ verified, ⚠️ missing, ❌ expired
✓ Required competencies listed per TRA hazard:
  - Electrical work: Licensed electrician + arc flash training
  - Confined space: Confined space entry certification
  - Working at height: Working at height training
✓ Stop-work if critical competency missing
✓ Ability to add substitute team member with competency verification
✓ Digital signatures for attendance confirmation

Team Verification Data:
- User profile competencies: organizations/{orgId}/users/{userId}
- Certification expiry dates tracked
- Training records linked from LMS (future integration)
```

**US-4.5: Equipment Verification**
```
As a Field Worker
I want to verify all required equipment is available and functional
So that I have necessary safety equipment before starting work

Acceptance Criteria:
✓ Equipment list from TRA control measures automatically loaded
✓ Checklist includes: PPE, tools, emergency equipment, communication devices
✓ Each item checkbox with optional photo documentation
✓ QR code scanning for equipment inspection verification
✓ Equipment condition assessment (good/damaged/expired)
✓ Stop-work if critical equipment unavailable or damaged
✓ Alternative equipment approval process (escalate to supervisor)

Equipment Categories:
- Personal Protective Equipment (PPE): helmets, gloves, suits, boots, eyewear
- Safety Equipment: harnesses, lanyards, gas detectors, fire extinguishers
- Tools: specific to task (insulated tools for electrical work)
- Communication: radios, phones, emergency beacons
- First Aid: kits, AED, rescue equipment
```

**US-4.6: Final Assessment and Decision**
```
As a Field Worker
I want to make a final go/no-go decision
So that I have clear authority to proceed or stop unsafe work

Acceptance Criteria:
✓ Summary of all LMRA checks: location, environment, team, equipment
✓ Visual indicators for each section: ✅ Pass, ⚠️ Caution, ❌ Fail
✓ Photo gallery of documented conditions
✓ Comment field for additional observations
✓ Three-tier decision:
  🔴 STOP WORK - Unsafe, do not proceed
  🟡 PROCEED WITH CAUTION - Minor issues, proceed with extra vigilance
  🟢 SAFE TO PROCEED - All checks passed
✓ Digital signature required for final decision
✓ Automatic supervisor notification if STOP WORK selected
✓ LMRA submission timestamp and GPS coordinates recorded
✓ Immutable audit trail created

Stop-Work Authority:
- Any team member can trigger STOP WORK
- Supervisor notification immediate (push notification + SMS)
- Work cannot resume until supervisor approves
- Clear documentation of stop reason
```

**US-4.7: Photo Documentation**
```
As a Field Worker
I want to capture photos of work conditions
So that I have visual evidence for safety compliance

Acceptance Criteria:
✓ In-app camera access (no need to leave app)
✓ Automatic EXIF data: GPS coordinates, timestamp
✓ Photo categories: work area, equipment, hazards, team, environmental conditions
✓ Client-side image compression before upload (reduce data usage)
✓ Photos attached to specific LMRA sections
✓ Offline capability: photos cached locally, uploaded when online
✓ Photo gallery review before submission
✓ Annotation capability (arrows, circles, text)

Technical Requirements:
- Max 5MB per photo after compression
- Target: 800x600px resolution (sufficient for documentation)
- JPEG format
- Metadata preserved for audit trail
- Storage: organizations/{orgId}/lmra/{sessionId}/photos/
```

---

### Feature 5: Offline Synchronization

**Epic**: As a Field Worker, I need reliable offline functionality so that I can perform LMRAs in areas with poor or no connectivity.

#### User Stories

**US-5.1: Offline TRA Access**
```
As a Field Worker
I want to download TRAs for offline access
So that I can view safety information without internet

Acceptance Criteria:
✓ Auto-download of assigned TRAs when online
✓ Manual download option for specific TRAs
✓ Offline indicator clearly visible in UI
✓ Downloaded TRAs include all data: steps, hazards, controls, photos
✓ Storage limit warning (e.g., 50 TRAs max)
✓ Auto-cleanup of old/completed TRAs (configurable)
✓ Offline status displayed per TRA (cached date)

Technical Implementation:
- Service Worker caching for PWA
- IndexedDB for large data storage
- Cache strategy: Network-first, fallback to cache
- Maximum cache: 100MB (configurable)
```

**US-5.2: Offline LMRA Execution**
```
As a Field Worker
I want to complete LMRAs fully offline
So that connectivity issues don't block my work

Acceptance Criteria:
✓ All LMRA steps completable without internet:
  - Location capture (GPS works offline)
  - Checklists (all stored locally)
  - Photos (stored locally until sync)
  - Comments (stored locally)
  - Final decision (stored locally)
✓ Clear visual indicator of offline mode
✓ Queue of pending sync operations visible
✓ Automatic sync when connection restored
✓ Manual sync trigger available
✓ Conflict resolution for concurrent edits (rare but possible)

Offline Data Strategy:
- Write to IndexedDB immediately
- Queue sync operations
- Exponential backoff for sync retries
- Conflict resolution: last-write-wins for LMRA (single user typically)
```

**US-5.3: Sync Queue Management**
```
As a Field Worker
I want visibility into pending synchronization
So that I know my data is safely uploaded

Acceptance Criteria:
✓ Sync queue shows pending operations:
  - LMRA completions
  - Photo uploads
  - Risk assessments
  - Comments
✓ Progress indicator during sync (X of Y items)
✓ Success/failure status per item
✓ Retry mechanism for failed syncs
✓ Manual retry option
✓ Warning if data not synced for >24 hours
✓ Automatic sync on connection restoration

Sync Priority:
1. Critical: LMRA stop-work decisions (immediate)
2. High: LMRA completions (within 1 hour)
3. Medium: Photos (within 4 hours)
4. Low: Comments, minor updates (within 24 hours)
```

---

## Collaboration & Approval Features

### Feature 6: Real-time Collaborative Editing

**Epic**: As a Safety Manager, I need to collaborate with my team on TRA creation so that we can leverage collective expertise.

#### User Stories

**US-6.1: Live Presence Indicators**
```
As a Safety Manager
I want to see who else is editing the TRA
So that I can avoid conflicts and coordinate changes

Acceptance Criteria:
✓ Active users displayed with names and avatars
✓ Real-time updates when users join/leave
✓ Color-coded cursors showing where each user is editing
✓ User activity: "John is editing Step 3", "Sarah is adding hazard"
✓ Idle timeout: user marked inactive after 5 minutes no activity
✓ Maximum 10 concurrent editors (performance)

Technical Implementation:
- Firestore real-time listeners for user presence
- Update presence every 30 seconds (heartbeat)
- Cursor position shared via Firestore document field
- Cleanup stale presence on disconnect
```

**US-6.2: Comment and Annotation System**
```
As a Team Member
I want to comment on specific TRA sections
So that I can provide feedback without direct editing

Acceptance Criteria:
✓ Comments can be added to: entire TRA, specific step, specific hazard, specific control
✓ @mentions to notify specific team members
✓ Comment threads for discussions
✓ Resolve/unresolve functionality
✓ Comment history preserved (who, when, what)
✓ Notification sent to mentioned users
✓ Comments visible to all organization members with TRA access

Comments Data Structure:
organizations/{orgId}/tras/{traId}/comments/{commentId}
- author: userId
- text: string
- mentions: userId[]
- attachedTo: section/step/hazard ID
- createdAt: timestamp
- resolved: boolean
```

**US-6.3: Change Tracking and History**
```
As a Safety Manager
I want to track all changes to the TRA
So that I have full audit trail for compliance

Acceptance Criteria:
✓ Version history shows all changes with timestamps
✓ Change details: who changed what, when, why (optional comment)
✓ Diff view: before/after comparison
✓ Ability to revert to previous version
✓ Export change history for audit purposes
✓ Automatic change detection (no manual "save version")

Audit Trail Data:
organizations/{orgId}/auditLogs/{logId}
- Immutable log entries
- Fields: action, userId, timestamp, documentId, before, after
- Retention: indefinite for compliance
```

---

### Feature 7: Approval Workflow System

**Epic**: As an Administrator, I need configurable approval workflows so that TRAs go through proper review before work begins.

#### User Stories

**US-7.1: Multi-Step Approval Configuration**
```
As an Administrator
I want to configure approval workflows for TRAs
So that we meet our organizational governance requirements

Acceptance Criteria:
✓ Configurable approval steps (1-5 steps)
✓ Each step includes: role required, number of approvers, approval criteria
✓ Role-based routing:
  - Technical Review: Senior electrician, engineer, specialist
  - Safety Manager Approval: Safety manager or deputy
  - Project Manager Sign-off: Project manager
  - Executive Approval: Required for very high-risk TRAs
✓ Sequential or parallel approval (configurable per step)
✓ Automatic approver assignment based on role
✓ Substitute approver designation
✓ Approval deadline configuration (e.g., 48 hours per step)

Workflow Configuration:
organizations/{orgId}/settings/approvalWorkflows
- Default workflow for all TRAs
- Risk-based workflows (higher risk = more approvals)
- Project-specific workflows
```

**US-7.2: Approval Request and Notification**
```
As a Safety Manager
I want approvers automatically notified when TRA submitted
So that approvals don't get delayed

Acceptance Criteria:
✓ Email notification to all required approvers
✓ In-app notification (bell icon)
✓ Push notification (if enabled)
✓ Notification includes: TRA title, risk level, requester, deadline
✓ Direct link to TRA for approval
✓ Reminder notifications if no response within 24 hours
✓ Escalation notification to supervisor if deadline missed

Notification Template:
Subject: TRA Approval Required: [TRA Title]
Body:
- TRA: [Title]
- Risk Level: [Color] [Level]
- Submitted by: [Name]
- Deadline: [Date/Time]
- [View TRA] [Approve] [Reject] [Request Changes]
```

**US-7.3: Approval Decision Making**
```
As an Approver
I want to review TRA details and make informed approval decisions
So that I fulfill my safety responsibility

Acceptance Criteria:
✓ Full TRA view with all details: steps, hazards, risk scores, controls
✓ Change history visible (what changed since last approval)
✓ Comments from previous reviewers visible
✓ Three decision options:
  ✅ Approve: TRA meets standards, work can proceed
  ❌ Reject: TRA inadequate, major revisions required
  🔄 Request Changes: Minor revisions needed, re-submit
✓ Comment field required for reject/request changes
✓ Digital signature capture for approval
✓ Approval timestamp and user recorded immutably
✓ TRA status updates automatically (draft → review → approved)

Approval Validation:
- Cannot approve own TRA
- Must have required role/competency
- Cannot skip approval steps
- All previous steps must be complete
```

**US-7.4: Rejection and Revision Handling**
```
As a Safety Manager
I want clear feedback when TRA is rejected
So that I know exactly what needs improvement

Acceptance Criteria:
✓ Rejection notification with reasons
✓ Ability to view all reviewer comments
✓ TRA returns to draft status for editing
✓ Change tracking: what was changed to address feedback
✓ Re-submission triggers approval workflow from beginning or rejected step (configurable)
✓ Version control: rejected version preserved, new version created
✓ Notification to original submitter on approval/rejection

Revision Workflow:
1. TRA rejected with comments
2. Safety Manager makes revisions
3. Change summary generated automatically
4. Re-submit triggers appropriate approval step
5. Approvers see: original version, current version, changes made
```

---

## Compliance & Audit Features

### Feature 8: VCA Compliance Checking

**Epic**: As a Safety Manager, I need automated VCA compliance checking so that I ensure my TRAs meet regulatory standards.

#### User Stories

**US-8.1: VCA Template Certification**
```
As a Safety Manager
I want templates marked as VCA-compliant
So that I know they meet regulatory standards

Acceptance Criteria:
✓ VCA badge on certified templates
✓ VCA version/standard referenced (e.g., VCA 2017 v5.1)
✓ Compliance checklist for each template:
  - Required hazard categories covered
  - Minimum control measures specified
  - Validity period compliant (max 12 months)
  - Approval workflow configured
✓ Certification date and authority shown
✓ Automatic compliance check when template selected
✓ Warning if template modified in way that breaks compliance

VCA Requirements:
- Templates must cover all applicable hazards
- Risk assessment methodology documented
- Control hierarchy followed
- Competency requirements specified
- Review/update schedule defined
```

**US-8.2: Compliance Scoring**
```
As a Safety Manager
I want to see a compliance score for each TRA
So that I know how well it meets standards

Acceptance Criteria:
✓ Compliance score calculated: 0-100%
✓ Score breakdown by category:
  - Hazard identification completeness (30%)
  - Risk assessment quality (25%)
  - Control measures adequacy (25%)
  - Documentation completeness (10%)
  - Approval workflow compliance (10%)
✓ Minimum 80% required for approval
✓ Visual indicator: Green (>80%), Yellow (60-80%), Red (<60%)
✓ Recommendations for improving score
✓ Compliance trends over time (dashboard)

Scoring Algorithm:
- Hazards: All relevant categories addressed?
- Risk scores: All calculated, high risks addressed?
- Controls: Hierarchy followed, all high risks mitigated?
- Documentation: All fields complete, signatures present?
- Approval: Proper workflow followed, approvers qualified?
```

**US-8.3: Regulatory Reporting**
```
As a Safety Manager
I want to generate compliance reports for auditors
So that I can demonstrate regulatory adherence

Acceptance Criteria:
✓ VCA compliance report template
✓ Report includes: TRA summary, compliance scores, risk trends, incidents
✓ Filter by: date range, project, risk level
✓ PDF export with company branding
✓ Excel export for data analysis
✓ Audit trail export (all changes, approvals, rejections)
✓ Anonymous incident reporting option
✓ Pre-formatted for VCA audit requirements

Report Sections:
1. Executive Summary
2. TRA Compliance Overview (scores, trends)
3. High-Risk Activities (detail)
4. Incident Correlation
5. Training and Competency Status
6. Recommendations and Action Items
```

---

### Feature 9: Immutable Audit Trail

**Epic**: As an Administrator, I need a complete, tamper-proof audit trail so that we can investigate incidents and demonstrate compliance.

#### User Stories

**US-9.1: Comprehensive Activity Logging**
```
As a System Administrator
I want all user actions logged immutably
So that we have complete accountability

Acceptance Criteria:
✓ All actions logged: create, read, update, delete, approve, reject
✓ Log entry includes: user, action, timestamp, document, before/after state
✓ Immutable logs (append-only, no deletion)
✓ Log retention: indefinite for compliance
✓ Searchable by: user, date range, action type, document
✓ Export capability for external audit
✓ Tamper-evident (hash chaining optional for high security)

Logged Actions:
- TRA: create, edit, submit, approve, reject, archive
- LMRA: execute, complete, stop-work, override
- User: login, logout, role change, permission grant
- Organization: setting change, user add/remove
- Billing: subscription change, payment
```

**US-9.2: Incident Investigation Support**
```
As a Safety Manager
I want to reconstruct TRA history for incident investigations
So that I can identify root causes

Acceptance Criteria:
✓ Timeline view of all TRA changes
✓ Filter by: date range, user, section
✓ Diff view showing exact changes
✓ Associated LMRAs linked to TRA
✓ Team member activities during incident period
✓ Photo documentation accessible
✓ Export incident investigation package (PDF with all relevant data)

Investigation Package Contents:
- Complete TRA history (all versions)
- All related LMRAs
- Photo documentation
- Team communications (comments)
- Approval trail
- Training records of involved personnel
```

**US-9.3: Compliance Audit Export**
```
As an Administrator
I want to export audit data for regulatory compliance
So that we can provide evidence to auditors

Acceptance Criteria:
✓ Date range selection for audit period
✓ Export formats: PDF (human-readable), CSV (data analysis), JSON (system integration)
✓ Export includes: user actions, document changes, approvals, rejections
✓ Filter by: organization, project, user, action type
✓ Anonymization option (remove personal data except roles)
✓ Digital signature on export for authenticity
✓ Export log (who exported what, when)

Audit Export Sections:
1. Summary statistics
2. User activity report
3. Document change log
4. Approval/rejection summary
5. Incident reports
6. Compliance metrics
```

---

## Reporting & Analytics Features

### Feature 10: Executive Safety Dashboard

**Epic**: As an Executive, I need real-time safety metrics so that I can make informed decisions and monitor organizational safety performance.

#### User Stories

**US-10.1: Real-time Safety KPIs**
```
As an Executive
I want to see key safety indicators at a glance
So that I understand current safety status quickly

Acceptance Criteria:
✓ Dashboard auto-refreshes every 60 seconds
✓ Key metrics displayed:
  - Active TRAs (total count, by risk level)
  - LMRAs completed today/this week
  - Average risk score (trend up/down)
  - Incidents this month (year-over-year comparison)
  - Compliance rate (TRAs approved vs rejected)
  - Overdue LMRAs
  - Team members certified vs needing training
✓ Color-coded indicators: Green (good), Yellow (attention), Red (urgent)
✓ Drill-down capability (click metric for details)
✓ Date range selector (today, week, month, quarter, year)
✓ Comparison: current period vs previous period

Metric Calculations:
- Active TRAs: status = 'approved' OR 'active'
- Average Risk Score: mean(tra.overallRiskScore) for active TRAs
- LMRA Completion Rate: (completed LMRAs / scheduled LMRAs) × 100%
- Compliance Rate: (approved TRAs / submitted TRAs) × 100%
```

**US-10.2: Risk Trend Visualization**
```
As a Safety Manager
I want to visualize risk trends over time
So that I can identify improvement or deterioration patterns

Acceptance Criteria:
✓ Line chart: average risk score over time (6 months default, configurable)
✓ Bar chart: TRA count by risk level (Very High, High, Substantial, Possible, Low)
✓ Donut chart: risk distribution by category (Electrical, Mechanical, etc.)
✓ Heat map: risk by project and time period
✓ Trend indicators: ↗️ improving, → stable, ↘️ worsening
✓ Comparison overlays (e.g., this year vs last year)
✓ Export charts as images (PNG) for presentations

Visualization Library:
- Use Recharts (React charting library)
- Responsive design (mobile-friendly)
- Interactive tooltips
- Click to drill-down
```

**US-10.3: Project Performance Comparison**
```
As an Executive
I want to compare safety performance across projects
So that I can identify best practices and problem areas

Acceptance Criteria:
✓ Table view: projects with safety metrics
  - Project name, Active TRAs, Average risk score, LMRAs completed, Incidents
✓ Sort by any column
✓ Filter by: project status, date range, risk level
✓ Visual indicators: red flag for high-risk projects
✓ Benchmark: organization average vs project performance
✓ Export to Excel for offline analysis

Benchmarking:
- Organization average calculated across all projects
- Industry benchmark (if available from anonymized data)
- Best-in-class comparison (top 10% of projects)
```

---

### Feature 11: Custom Report Builder

**Epic**: As a Safety Manager, I need to create custom reports so that I can communicate safety information to different stakeholders.

#### User Stories

**US-11.1: Drag-and-Drop Report Designer**
```
As a Safety Manager
I want to design custom reports visually
So that I can create stakeholder-specific communications

Acceptance Criteria:
✓ Drag-and-drop interface for report sections:
  - Executive summary
  - KPI widgets
  - Charts and graphs
  - Data tables
  - TRA listings
  - Photo galleries
  - Text blocks
✓ Section templates for common report types
✓ Preview before generating
✓ Save report layouts as templates
✓ Share templates with organization

Report Builder Components:
- Text editor with rich formatting
- Chart configurator (type, data source, filters)
- Table designer (columns, sorting, filters)
- Image uploader for custom graphics
- Logo and branding customization
```

**US-11.2: Data Source Configuration**
```
As a Safety Manager
I want to configure data sources for report sections
So that reports show the exact information I need

Acceptance Criteria:
✓ Each report section has configurable data source:
  - Date range selector
  - Project filter (all, specific projects, tagged)
  - Risk level filter
  - User/team filter
  - Status filter (draft, approved, archived)
✓ Real-time data (report generated on demand)
✓ Aggregation functions: sum, average, count, min, max
✓ Grouping and sorting options

Query Builder:
- Visual query builder (no SQL required)
- Filter logic: AND, OR, NOT
- Validation: preview data before adding to report
```

**US-11.3: Professional PDF Generation**
```
As a Safety Manager
I want to generate professional PDF reports
So that I can share with external auditors and clients

Acceptance Criteria:
✓ PDF includes: cover page, table of contents, numbered pages, footer
✓ Company branding: logo, colors, fonts
✓ Charts rendered as high-quality images
✓ Tables with proper formatting and page breaks
✓ Photo galleries with captions
✓ Confidentiality marking options (Internal, Confidential, Public)
✓ Digital signature option
✓ Export quality: print-ready (300 DPI)

PDF Library:
- Use jsPDF or pdfmake for generation
- Template-based layout
- Page size: A4 or Letter (configurable)
- Compression for reasonable file size (<10MB for 50-page report)
```

---

## User Management Features

### Feature 12: Role-Based Access Control (RBAC)

**Epic**: As an Administrator, I need granular role-based permissions so that users only access appropriate information and functions.

#### User Stories

**US-12.1: Four-Tier Role System**
```
As an Administrator
I want to assign users to appropriate roles
So that access is properly controlled

Acceptance Criteria:
✓ Four predefined roles with clear permissions:

1. ADMIN (Organization Administrator)
   - Full access to organization settings
   - User management (invite, edit, remove)
   - Billing and subscription management
   - All TRA and LMRA access
   - Analytics and reporting access
   - Audit log access

2. SAFETY_MANAGER (Safety Manager/Coordinator)
   - Create, edit, approve TRAs
   - Manage templates and hazard library
   - All project access
   - Analytics and reporting access
   - Team management (assign users to projects)
   - Cannot manage billing or organization settings

3. SUPERVISOR (Site Supervisor/Foreman)
   - Create and edit TRAs (own projects only)
   - Review TRAs (technical review step)
   - Assign LMRAs to field workers
   - Execute LMRAs
   - View analytics (own projects only)
   - Cannot approve TRAs or manage users

4. FIELD_WORKER (Technician/Operator)
   - View assigned TRAs (read-only)
   - Execute LMRAs
   - Upload photos and comments
   - View own LMRA history
   - Cannot create or edit TRAs

✓ Role assigned during user invitation
✓ Role can be changed by admin (with audit log)
✓ Single role per user (no role stacking)
✓ Role displayed on user profile and in all interactions
```

**US-12.2: Custom Role Permissions (Future)**
```
As an Administrator
I want to create custom roles with specific permissions
So that I can match my organization's unique structure

Acceptance Criteria (Phase 2):
✓ Create custom roles with name and description
✓ Granular permission toggles:
  - TRA: create, edit, approve, delete, view all, view own
  - LMRA: execute, view all, view own
  - Templates: create, edit, delete, view
  - Users: invite, edit, remove, view
  - Reports: create, view, export
  - Settings: organization, billing, security
✓ Assign custom roles to users
✓ Role templates for common scenarios
✓ Permission conflicts prevented (e.g., can't delete without view)
```

**US-12.3: Project-Based Access Control**
```
As an Administrator
I want to assign users to specific projects
So that they only see relevant work

Acceptance Criteria:
✓ Project membership configured per user
✓ Options: All Projects (global access) or Specific Projects (limited)
✓ TRA visibility: users see only TRAs for their projects
✓ LMRA assignment: can only be assigned LMRAs for their projects
✓ Supervisor can be project lead (additional permissions within project)
✓ Easy project reassignment (bulk operations)

Project Assignment UI:
- User profile shows assigned projects
- Project page shows assigned users
- Drag-and-drop for easy reassignment
- Role override: Safety Managers have all-project access by default
```

---

### Feature 13: User Competency Tracking

**Epic**: As a Safety Manager, I need to track user competencies and certifications so that only qualified personnel perform high-risk work.

#### User Stories

**US-13.1: Competency Profile Management**
```
As an Administrator
I want to maintain competency profiles for users
So that we ensure qualifications are current

Acceptance Criteria:
✓ User profile includes competencies section:
  - Certification name
  - Issuing authority
  - Issue date
  - Expiry date
  - Certificate number
  - Upload certificate PDF/image
✓ Common competencies pre-configured:
  - VCA Basic Safety (VCA Basis)
  - VCA Safety for Operatives (VCA VOL)
  - VCA Safety for Supervisors (VCA Uitvoerder)
  - Electrical License (Level 1, 2, 3)
  - Working at Height Certification
  - Confined Space Entry
  - First Aid/CPR
  - Fork Lift Operator
  - Crane Operator
✓ Custom competency definitions (organization-specific)
✓ Expiry tracking: warnings at 30/14/7 days before expiry
✓ Expired competencies marked with ⚠️ warning
✓ Bulk import from CSV

Competency Data Structure:
organizations/{orgId}/users/{userId}/competencies/{compId}
- name: string
- authority: string
- issueDate: timestamp
- expiryDate: timestamp
- certificateNumber: string
- certificateFile: storage URL
- status: 'valid' | 'expiring_soon' | 'expired'
```

**US-13.2: Competency Requirements per TRA**
```
As a Safety Manager
I want to specify required competencies for each TRA
So that only qualified people can execute the work

Acceptance Criteria:
✓ TRA includes "Required Competencies" section
✓ Select from organization competency list
✓ Specify minimum level/certification (e.g., Electrical License Level 2)
✓ Link competencies to specific hazards/tasks
✓ Team assignment validation: assigned users must have required competencies
✓ LMRA execution blocked if executor lacks required competency
✓ Override mechanism: supervisor approval for substitutions

Validation Rules:
- At TRA assignment: warning if team member lacks competency
- At LMRA execution: hard block if required competency missing
- Substitute approval: supervisor can approve one-time exception with justification
```

**US-13.3: Competency Expiry Alerts**
```
As a Safety Manager
I want to be alerted when team member certifications are expiring
So that we can arrange renewals proactively

Acceptance Criteria:
✓ Email alerts sent at: 30 days, 14 days, 7 days before expiry
✓ In-app notification on dashboard
✓ Competency expiry report:
  - Users with expiring competencies (next 90 days)
  - Users with expired competencies
  - Competency renewal deadlines
✓ Filter by: competency type, user, project
✓ Export to Excel for training coordination
✓ Automatic user notification (email + app)

Alert Content:
"[User Name]'s [Competency] certification expires on [Date].
Renewal required to continue [associated tasks].
Contact: [Training Coordinator]"
```

---

## Non-Functional Requirements

### Performance Requirements

**PR-1: Page Load Performance**
```
Requirement: Fast, responsive user experience
Acceptance Criteria:
✓ Initial page load: <2 seconds (desktop), <3 seconds (mobile)
✓ Time to Interactive (TTI): <3 seconds
✓ First Contentful Paint (FCP): <1.8 seconds
✓ Largest Contentful Paint (LCP): <2.5 seconds
✓ Cumulative Layout Shift (CLS): <0.1
✓ API response time: <500ms for 95th percentile

Performance Targets (Web Vitals):
- Lighthouse score: >90 (Performance, Accessibility, Best Practices, SEO)
- Bundle size: <500KB gzipped JavaScript
- Image optimization: WebP format, lazy loading
- Code splitting: route-based, component-based
```

**PR-2: Scalability**
```
Requirement: Support organizational growth
Acceptance Criteria:
✓ Support 1000+ concurrent users per organization
✓ Database: 10,000+ TRAs per organization
✓ File storage: 1TB+ per organization
✓ Real-time updates: <5 second latency with 100+ concurrent editors
✓ No performance degradation with data growth

Scalability Strategy:
- Firebase auto-scaling (handles millions of operations)
- Pagination: 50 items per page
- Lazy loading: infinite scroll for large lists
- Query optimization: indexed fields, compound indexes
```

**PR-3: Availability & Reliability**
```
Requirement: Always accessible when needed
Acceptance Criteria:
✓ Uptime: >99.5% (excluding planned maintenance)
✓ Planned downtime: <4 hours/month, communicated 7 days advance
✓ Data durability: >99.999999999% (11 9's - Firebase guarantee)
✓ Disaster recovery: <1 hour RPO (Recovery Point Objective)
✓ Backup frequency: Daily automated, 30-day retention

Monitoring:
- Uptime Robot: 5-minute checks
- Sentry: Error tracking and alerting
- Vercel Analytics: Performance monitoring
- Custom health check endpoint: /api/health
```

### Security Requirements

**SR-1: Data Encryption**
```
Requirement: Protect sensitive safety data
Acceptance Criteria:
✓ Data in transit: TLS 1.3 encryption (HTTPS)
✓ Data at rest: AES-256 encryption (Firebase Storage default)
✓ Database encryption: Firebase Firestore encryption at rest (default)
✓ API authentication: Firebase ID tokens (JWT), 1-hour expiry
✓ Password requirements: Minimum 8 characters, uppercase, lowercase, number
✓ MFA support: SMS, authenticator app for admin users

Encryption Standards:
- TLS 1.3 for all API calls
- No plain-text passwords stored
- Secrets managed via environment variables
- Stripe webhook signatures verified
```

**SR-2: Access Control**
```
Requirement: Ensure proper data isolation and permissions
Acceptance Criteria:
✓ Multi-tenant isolation: complete data separation between organizations
✓ Row-level security: Firestore security rules enforce organization context
✓ API authentication: all routes require valid Firebase token
✓ Rate limiting: 100 requests/minute per user, 1000/hour per org
✓ Session management: automatic logout after 24 hours inactivity
✓ Password reset: secure email-based flow with time-limited tokens

Security Rules:
- All Firestore queries validate orgId from auth token
- Custom claims used for role-based access
- No client-side security bypasses possible
```

**SR-3: GDPR Compliance**
```
Requirement: Meet EU data protection regulations
Acceptance Criteria:
✓ User consent tracking: explicit consent for data processing
✓ Data export: complete user data export in JSON format
✓ Right to erasure: complete data deletion within 30 days of request
✓ Data minimization: only collect necessary data
✓ Privacy policy: clear, accessible, version-tracked
✓ Data processing agreement: available for all customers
✓ Data breach notification: <72 hours to authorities, immediate to users

GDPR Features:
- Cookie consent banner
- Privacy settings page
- Data export tool (account settings)
- Account deletion with confirmation
- Audit log of data access
```

### Accessibility Requirements

**AR-1: WCAG 2.1 AA Compliance**
```
Requirement: Accessible to users with disabilities
Acceptance Criteria:
✓ Keyboard navigation: all functions accessible without mouse
✓ Screen reader support: proper ARIA labels, semantic HTML
✓ Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
✓ Focus indicators: visible focus states on all interactive elements
✓ Resizable text: readable at 200% zoom without horizontal scroll
✓ Alternative text: all images have descriptive alt text
✓ Forms: proper labels, error messages, validation feedback

Testing:
- Lighthouse accessibility score: >90
- Manual screen reader testing: NVDA (Windows), VoiceOver (Mac/iOS)
- Keyboard-only navigation testing
- Color blindness simulation testing
```

**AR-2: Mobile Accessibility**
```
Requirement: Accessible on mobile devices
Acceptance Criteria:
✓ Touch targets: minimum 44×44 pixels (iOS HIG, Android Material)
✓ Gesture alternatives: all swipe/pinch actions have button alternatives
✓ Text legibility: minimum 16px font size on mobile
✓ Responsive design: usable on 320px to 2560px width
✓ Orientation: works in portrait and landscape
✓ Voice input: compatible with mobile voice dictation

Mobile-Specific Features:
- Large tap areas for field workers with gloves
- Voice-to-text for comments (Phase 2)
- High-contrast mode for bright sunlight
```

---

## Technical Requirements

### Frontend Stack

**FS-1: Next.js 14 with App Router**
```
Framework: Next.js 14
Rationale: Full-stack React framework with excellent DX
Features Required:
✓ Server-Side Rendering (SSR) for SEO and initial load
✓ Static Site Generation (SSG) for marketing pages
✓ Client-Side Rendering (CSR) for interactive forms
✓ API Routes for backend logic
✓ Image optimization (next/image)
✓ Bundle optimization (automatic code splitting)

Configuration:
- TypeScript strict mode
- ESLint + Prettier integration
- Tailwind CSS for styling
- Path aliases (@/components, @/lib, etc.)
```

**FS-2: React 18 Features**
```
React Version: 18.2+
Features Used:
✓ Server Components for performance
✓ Suspense for loading states
✓ useTransition for responsive UI
✓ useDeferredValue for search/filter optimization
✓ React Hook Form for form state management
✓ Zod for validation

State Management:
- React Context for global state (auth, organization)
- useReducer for complex component state
- Firestore real-time subscriptions for data sync
- NO Redux (over-engineering for this use case)
```

**FS-3: Progressive Web App (PWA)**
```
PWA Requirements:
✓ Service Worker for offline support
✓ Web App Manifest for installability
✓ Offline-first architecture
✓ Background sync for data synchronization
✓ Push notifications (Phase 2)
✓ Add to Home Screen prompts

PWA Configuration:
- Workbox for service worker generation
- Cache strategies:
  - Network-first: API calls
  - Cache-first: static assets
  - Stale-while-revalidate: images
- IndexedDB for offline data storage (>50MB capacity)
```

### Backend Stack

**BS-1: Firebase Services**
```
Services Used:
1. Firebase Authentication
   - Email/password authentication
   - Google OAuth (social login)
   - Custom claims for RBAC
   - Session management

2. Cloud Firestore (NoSQL Database)
   - Real-time synchronization
   - Offline support
   - Security rules for data isolation
   - Automatic scaling

3. Cloud Storage
   - File uploads (photos, PDFs, certificates)
   - Automatic CDN distribution
   - Security rules for access control
   - Image optimization (Cloud Functions)

4. Cloud Functions (Background Processing)
   - Thumbnail generation for photos
   - Email notifications via SendGrid
   - Stripe webhook handling
   - Scheduled jobs (reminders, exports)

5. Firebase Analytics
   - User behavior tracking
   - Performance monitoring
   - Custom event tracking
```

**BS-2: API Architecture**
```
API Pattern: REST API via Next.js API Routes
Structure:
- /api/tras/* - TRA CRUD operations
- /api/lmra/* - LMRA execution
- /api/auth/* - Authentication flows
- /api/organizations/* - Organization management
- /api/users/* - User management
- /api/reports/* - Report generation

Standards:
- RESTful conventions (GET, POST, PUT, DELETE)
- JSON request/response
- Error handling with standard codes
- Rate limiting via Upstash Redis
- Request validation with Zod
- Authentication via Firebase Admin SDK
```

### Deployment Stack

**DS-1: Vercel Platform**
```
Deployment: Vercel
Features:
✓ Automatic deployments from Git
✓ Preview deployments for PRs
✓ Edge network (global CDN)
✓ Automatic HTTPS
✓ Environment variable management
✓ Zero-config Next.js optimization

Configuration:
- Production: main branch
- Staging: develop branch
- Preview: all PRs
- Domain: custom domain with DNS
```

**DS-2: CI/CD Pipeline**
```
Pipeline: GitHub Actions + Vercel
Stages:
1. Lint: ESLint check
2. Type Check: TypeScript compilation
3. Test: Jest unit tests, Cypress E2E
4. Build: Next.js production build
5. Deploy: Vercel deployment
6. Smoke Test: Production health check

Automation:
- Run on: every push, every PR
- Required checks before merge
- Automatic deployment on merge to main
- Rollback capability (Vercel deployments)
```

---

## Appendix: User Story Format

All user stories follow this format:

```
Title: US-X.Y: [Short Description]

As a [role]
I want to [action/feature]
So that [benefit/value]

Acceptance Criteria:
✓ [Specific, testable criterion 1]
✓ [Specific, testable criterion 2]
✓ ...

Technical Notes: [Implementation guidance]
Domain Rules: [Business logic from TRA/LMRA domain]
Dependencies: [Other features required]
Priority: [Must Have / Should Have / Could Have]
Estimated Effort: [Days/weeks]
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Sep 29, 2025 | Solo Developer | Initial detailed requirements based on info.md domain knowledge |

---

**Next Steps:**
1. ✅ Feature requirements documented
2. [ ] Market validation (Tasks 1.4A-1.4E) - confirm feature priorities with customers
3. [ ] Technical architecture design (data models, API specs)
4. [ ] Begin development (Task 2.1 onwards)

**Review Frequency**: After market validation, then monthly during development

**Approval**: Requires validation with 3-5 design partners before development begins
