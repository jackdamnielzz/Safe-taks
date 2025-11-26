# Approval Workflow Implementation - Week 2 MVP

**Status**: ✅ Core Implementation Complete  
**Date**: 31 oktober 2025  
**Priority**: 🔴 KRITIEK voor MVP

---

## 📋 Executive Summary

De volledige approval workflow is geïmplementeerd volgens de MVP requirements uit [`PROJECT_STATUS_RAPPORT.md`](PROJECT_STATUS_RAPPORT.md:1). Het systeem ondersteunt nu multi-step goedkeuringen, notificaties, en rejection/revision handling.

### Wat is Geïmplementeerd

✅ **Multi-step Approval Configuration**
- Configureerbare goedkeuringsstappen per TRA
- Role-based approver assignment
- Due dates per stap

✅ **Notification System**
- In-app notificaties voor goedkeuringsverzoeken
- Push notificaties (via service worker)
- Email notificatie integratie (placeholder ready)

✅ **Approval Decision UI**
- Approve/Reject/Request Changes acties
- Verplichte opmerkingen bij afwijzing
- Real-time status updates

✅ **Rejection & Revision Handling**
- TRA status update naar "rejected"
- Mogelijkheid tot herziening en opnieuw indienen
- Audit trail van alle beslissingen

---

## 🏗️ Architectuur Overzicht

### Data Flow

```
TRA Creation → Submit for Approval → Approval Request Created
                                            ↓
                                    Notify Approvers
                                            ↓
                        ┌───────────────────┴───────────────────┐
                        ↓                                       ↓
                    Approve                                 Reject
                        ↓                                       ↓
                Next Step / Complete                    Mark as Rejected
                        ↓                                       ↓
                Notify Next Approver              Notify TRA Creator
                        ↓                                       ↓
                    Repeat                              Revise & Resubmit
```

### Database Schema

```typescript
// Firestore Collections
/organizations/{orgId}/approvals/{approvalId}
{
  id: string;
  traId: string;
  createdBy: string;
  createdAt: number;
  currentStep: number;  // 1-based
  steps: ApprovalStep[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notificationsSent: string[];
}

// Embedded in TRA document
/organizations/{orgId}/tras/{traId}
{
  ...
  approvalWorkflow: {
    approvalId: string;
    currentStep: number;  // 0-based index
    steps: ApprovalStep[];
    completedAt?: number;
  }
}
```

---

## 📁 Geïmplementeerde Files

### API Routes

1. **[`/api/approvals/route.ts`](web/src/app/api/approvals/route.ts:1)** - GET lijst van approvals
   - Filters op status (pending, approved, rejected)
   - Role-based filtering (assignedToMe)
   - Sorteer op createdAt

2. **[`/api/approvals/[approvalId]/route.ts`](web/src/app/api/approvals/[approvalId]/route.ts:1)** - GET/POST approval details
   - GET: Haal specifieke approval op
   - POST: Verwerk approval decision (approve/reject/request_changes)
   - Permission checking per step
   - Automatic TRA status updates

3. **[`/api/approvals/create/route.ts`](web/src/app/api/approvals/create/route.ts:1)** - POST nieuwe approval (bestaand, geen wijzigingen)

4. **[`/api/tras/[traId]/submit/route.ts`](web/src/app/api/tras/[traId]/submit/route.ts:1)** - POST submit TRA (bestaand, geen wijzigingen)

5. **[`/api/tras/[traId]/approve/route.ts`](web/src/app/api/tras/[traId]/approve/route.ts:1)** - POST approve TRA (bestaand, geen wijzigingen)

### UI Components

1. **[`ApprovalDecisionPanel.tsx`](web/src/components/approvals/ApprovalDecisionPanel.tsx:1)** - Hoofdcomponent voor goedkeuringsbeslissingen
   - Visuele weergave van alle stappen
   - Approve/Reject/Request Changes knoppen
   - Verplichte opmerkingen bij afwijzing
   - Real-time status badges

2. **[`ApprovalInbox.tsx`](web/src/components/approvals/ApprovalInbox.tsx:1)** - Lijst van goedkeuringsverzoeken (bestaand, geen wijzigingen)

3. **[`ApprovalConfigEditor.tsx`](web/src/components/approvals/ApprovalConfigEditor.tsx:1)** - Configuratie editor (bestaand, geen wijzigingen)

### Pages

1. **[`/approvals/page.tsx`](web/src/app/approvals/page.tsx:1)** - Approval inbox pagina
   - Overzicht van alle goedkeuringsverzoeken
   - Filter en zoek functionaliteit

2. **[`/approvals/[approvalId]/page.tsx`](web/src/app/approvals/[approvalId]/page.tsx:1)** - Approval detail pagina
   - TRA informatie
   - Volledige approval workflow weergave
   - Decision panel voor actieve stap

### Services

1. **[`notificationService.ts`](web/src/lib/notificationService.ts:1)** - Uitgebreid met approval notificaties
   - `sendApprovalRequest()` - Notificeer approvers
   - `sendApprovalDecision()` - Notificeer TRA creator
   - `sendApprovalEmail()` - Email integratie (placeholder)

### Translations

1. **[`nl.json`](web/src/messages/nl.json:1)** - Nederlandse vertalingen toegevoegd
   - `approvals.page.*` - Pagina teksten
   - `approvals.status.*` - Status labels
   - `approvals.steps.*` - Stap informatie
   - `approvals.decision.*` - Beslissing UI teksten

---

## 🔄 Approval Workflow Flow

### 1. TRA Submission

```typescript
// Field worker submits TRA
POST /api/tras/{traId}/submit
{
  createApproval: true,
  comments: "Ready for review"
}

// System creates approval request
// TRA status → "in_review"
// Notification sent to first approver
```

### 2. Approval Step Processing

```typescript
// Approver views approval
GET /api/approvals/{approvalId}

// Approver makes decision
POST /api/approvals/{approvalId}
{
  action: "approve" | "reject" | "request_changes",
  comments: "Looks good" | "Needs revision"
}

// System updates:
// - Current step status
// - Move to next step (if approved)
// - Update TRA status
// - Send notifications
```

### 3. Completion or Rejection

**Approved:**
```typescript
// All steps completed
// TRA status → "approved"
// Notification to TRA creator
// Ready for LMRA execution
```

**Rejected:**
```typescript
// Any step rejected
// TRA status → "rejected"
// Notification to TRA creator with comments
// Creator can revise and resubmit
```

---

## 🎨 UI/UX Features

### Approval Inbox ([`/approvals`](web/src/app/approvals/page.tsx:1))

- **Lijst weergave** van alle goedkeuringsverzoeken
- **Status badges**: Pending, Approved, Rejected
- **Quick actions**: Direct naar detail pagina
- **Filters**: Status, assigned to me

### Approval Detail ([`/approvals/[approvalId]`](web/src/app/approvals/[approvalId]/page.tsx:1))

- **TRA informatie card**
  - Titel, beschrijving
  - Creator, datum
  - Link naar volledige TRA

- **Stappen overzicht**
  - Visuele progress indicator
  - Status per stap (pending/approved/rejected)
  - Approver informatie
  - Opmerkingen per stap
  - Due dates

- **Decision panel** (alleen voor actieve stap)
  - Grote, duidelijke knoppen
  - Approve (groen)
  - Request Changes (geel)
  - Reject (rood)
  - Verplicht commentaar veld bij reject
  - Bevestiging voor elke actie

---

## 🔔 Notification System

### In-App Notifications

```typescript
// Via notificationService.ts
await notificationService.sendApprovalRequest(approval, approverIds);
await notificationService.sendApprovalDecision(approval, 'approved', [creatorId]);
```

### Push Notifications

- Service Worker integratie
- VAPID key configuratie
- Fallback naar local notifications

### Email Notifications (Placeholder)

```typescript
// Ready for Resend integration
POST /api/notifications/email
{
  type: 'approval-request' | 'approval-approved' | 'approval-rejected',
  approval: ApprovalRequest,
  recipientIds: string[]
}
```

**Email Templates Needed:**
1. `approval-request.html` - Nieuw goedkeuringsverzoek
2. `approval-approved.html` - TRA goedgekeurd
3. `approval-rejected.html` - TRA afgewezen met opmerkingen

---

## 🔐 Security & Permissions

### Role-Based Access Control

```typescript
// Permission check in API
const hasPermission =
  userRole === "admin" ||
  userRole === currentStep.approverRole ||
  currentStep.approverId === userId;

if (!hasPermission) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **admin** | Kan alle stappen goedkeuren |
| **safety_manager** | Kan safety manager stappen goedkeuren |
| **supervisor** | Kan supervisor stappen goedkeuren |
| **field_worker** | Kan TRA's indienen, geen goedkeuring |

### Audit Trail

Alle approval acties worden gelogd via [`writeAuditLog()`](web/src/lib/audit/audit-trail.ts:1):
- `approval.create` - Approval aangemaakt
- `approval.step.approved` - Stap goedgekeurd
- `approval.step.rejected` - Stap afgewezen
- `approval.changes_requested` - Wijzigingen gevraagd

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **TRA Submission**
  - [ ] Submit TRA met createApproval=true
  - [ ] Verify approval record created
  - [ ] Verify TRA status = "in_review"
  - [ ] Verify notification sent

- [ ] **Approval Process**
  - [ ] Login as approver
  - [ ] View approval inbox
  - [ ] Open approval detail
  - [ ] Approve step with comments
  - [ ] Verify next step activated
  - [ ] Verify notification sent

- [ ] **Rejection Flow**
  - [ ] Reject approval with comments
  - [ ] Verify TRA status = "rejected"
  - [ ] Verify creator notified
  - [ ] Revise TRA
  - [ ] Resubmit for approval

- [ ] **Multi-Step Flow**
  - [ ] Configure 3-step approval
  - [ ] Complete all steps
  - [ ] Verify TRA status = "approved"

### Automated Testing

```bash
# Run existing tests
npm test

# Tests to add:
# - web/src/__tests__/approval-workflow.test.ts
# - web/src/__tests__/integrations/approval-api.test.ts
# - web/src/components/approvals/__tests__/ApprovalDecisionPanel.test.tsx
```

---

## 📊 Metrics & Analytics

### KPIs to Track

1. **Time to Approval** - Gemiddelde tijd per stap
2. **Approval Rate** - % goedgekeurd vs afgewezen
3. **Bottlenecks** - Welke stappen duren het langst
4. **Rejection Reasons** - Analyse van afwijzingscommentaren

### Analytics Events

```typescript
// Already implemented in analytics-service.ts
trackApprovalStepCompleted({
  traId,
  step,
  decision: 'approved' | 'rejected',
  timeToDecision
});
```

---

## 🚀 Deployment Checklist

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key
VAPID_PRIVATE_KEY=your_private_key
RESEND_API_KEY=your_resend_key  # For email notifications
```

### Database Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "approvals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Firestore Rules

```javascript
// firestore.rules - Add approval rules
match /organizations/{orgId}/approvals/{approvalId} {
  allow read: if isOrgMember(orgId);
  allow create: if isOrgMember(orgId);
  allow update: if isOrgMember(orgId) && hasApprovalPermission(orgId, approvalId);
}
```

---

## 🔮 Future Enhancements (Post-MVP)

### Phase 2 Features

1. **Parallel Approvals**
   - Multiple approvers per step
   - Require all or any approval

2. **Conditional Workflows**
   - Different workflows based on risk level
   - Skip steps based on conditions

3. **Escalation Rules**
   - Auto-escalate overdue approvals
   - Notify managers after X days

4. **Approval Templates**
   - Save common workflows
   - Organization-wide defaults

5. **Advanced Notifications**
   - SMS notifications
   - Slack/Teams integration
   - Digest emails

6. **Analytics Dashboard**
   - Approval metrics visualization
   - Bottleneck identification
   - Performance reports

---

## 📚 Related Documentation

- [`PROJECT_STATUS_RAPPORT.md`](PROJECT_STATUS_RAPPORT.md:1) - Overall project status
- [`docs/gebruikers/approval-flow.md`](docs/gebruikers/approval-flow.md:1) - User guide
- [`web/src/types/approval.ts`](web/src/types/approval.ts:1) - Type definitions
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md:1) - API reference

---

## ✅ Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-step configuration | ✅ Complete | Via ApprovalConfigEditor |
| API routes | ✅ Complete | GET/POST endpoints |
| Decision UI | ✅ Complete | ApprovalDecisionPanel |
| Notifications (in-app) | ✅ Complete | Via notificationService |
| Notifications (push) | ✅ Complete | Service Worker ready |
| Notifications (email) | 🟡 Placeholder | Needs Resend integration |
| Rejection handling | ✅ Complete | Status updates + comments |
| Revision workflow | ✅ Complete | Resubmit capability |
| Dutch translations | ✅ Complete | All UI text |
| Audit trail | ✅ Complete | All actions logged |
| Permission checks | ✅ Complete | Role-based access |

---

## 🎯 Next Steps

1. **Email Integration** (1-2 dagen)
   - Setup Resend account
   - Create email templates
   - Implement send logic

2. **Testing** (2-3 dagen)
   - Write automated tests
   - Perform end-to-end testing
   - Fix any bugs found

3. **Documentation** (1 dag)
   - Update user guides
   - Create admin documentation
   - Record demo video

**Estimated Time to Production Ready**: 4-6 dagen

---

**Document Version**: 1.0  
**Last Updated**: 31 oktober 2025  
**Author**: Kilo Code AI Assistant