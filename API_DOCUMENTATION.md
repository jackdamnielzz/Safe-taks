# SafeWork Pro - Comprehensive API Documentation

**Document Version**: 1.0
**Last Updated**: October 8, 2025
**Framework**: Next.js 15 API Routes with TypeScript + Firebase
**Base URL**: `https://safeworkpro.com/api`

---

## Authentication & Authorization

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "token": "string",
  "user": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "role": "admin|safety_manager|supervisor|field_worker"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing email or password
- `401 AUTH_ERROR`: Invalid credentials
- `500 SERVER_ERROR`: Internal server error

**cURL Example:**
```bash
curl -X POST https://safeworkpro.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "displayName": "string (required)",
  "organizationName": "string (required)"
}
```

**Success Response (201):**
```json
{
  "token": "string",
  "user": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "role": "admin"
  },
  "organization": {
    "id": "string",
    "name": "string"
  }
}
```

---

### GET /api/auth/session

Get current user session information.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "user": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "role": "string",
    "orgId": "string"
  }
}
```

---

### POST /api/auth/logout

Log out current user session.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

### POST /api/auth/set-claims

Update user role and organization (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": "string (required)",
  "role": "admin|safety_manager|supervisor|field_worker (required)",
  "orgId": "string (required)"
}
```

---

## Organization Management

### GET /api/organizations

List organizations for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "subscriptionTier": "starter|professional|enterprise",
      "userCount": "number",
      "projectCount": "number",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### POST /api/organizations

Create a new organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (required)",
  "subscriptionTier": "starter|professional|enterprise (required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "subscriptionTier": "string",
    "createdAt": "string"
  }
}
```

---

### GET /api/organizations/{orgId}

Get organization details.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "subscriptionTier": "string",
    "userCount": "number",
    "projectCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

---

### PATCH /api/organizations/{orgId}

Update organization details.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "subscriptionTier": "string (optional)"
}
```

---

### DELETE /api/organizations/{orgId}

Soft delete organization (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "deleted": true
  }
}
```

---

### GET /api/organizations/members

List organization members.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (optional): Filter by role
- `status` (optional): Filter by status

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "email": "string",
      "displayName": "string",
      "role": "string",
      "status": "active|pending|inactive",
      "joinedAt": "string"
    }
  ]
}
```

---

### POST /api/organizations/members

Invite new member to organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "email": "string (required)",
  "role": "admin|safety_manager|supervisor|field_worker (required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "role": "string",
    "invitationToken": "string",
    "expiresAt": "string"
  }
}
```

---

### PATCH /api/organizations/members

Update member role or access.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": "string (required)",
  "role": "string (optional)",
  "status": "active|inactive (optional)"
}
```

---

### DELETE /api/organizations/members

Remove member from organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

---

## Project Management

### GET /api/projects

List projects in organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by name or location

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "location": "string",
      "status": "active|completed|on_hold",
      "memberCount": "number",
      "traCount": "number",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/projects

Create a new project.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "location": "string (optional)",
  "projectManager": "string (optional)"
}
```

---

### GET /api/projects/{projectId}

Get project details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### PATCH /api/projects/{projectId}

Update project details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/projects/{projectId}

Delete project.

**Headers:**
```
Authorization: Bearer {token}
```

---

### GET /api/projects/{projectId}/members

List project members.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/projects/{projectId}/members

Add member to project.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": "string (required)",
  "role": "owner|manager|contributor|reader (required)"
}
```

---

### PATCH /api/projects/{projectId}/members

Update project member role.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/projects/{projectId}/members

Remove member from project.

**Headers:**
```
Authorization: Bearer {token}
```

---

## TRA (Taak Risico Analyse) Management

### GET /api/tras

List TRAs in organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (draft|review|approved|active|archived)
- `projectId`: Filter by project
- `templateId`: Filter by template
- `createdBy`: Filter by creator
- `overallRiskLevel`: Filter by risk level
- `dateFrom`, `dateTo`: Date range filter
- `sort`: Sort field (-createdAt for descending)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "projectId": "string",
      "projectName": "string",
      "templateId": "string",
      "overallRiskScore": "number",
      "overallRiskLevel": "trivial|acceptable|moderate|substantial|high|very_high",
      "createdBy": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "validFrom": "string",
      "validUntil": "string"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/tras

Create a new TRA.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "projectId": "string (required)",
  "templateId": "string (optional)",
  "taskSteps": [
    {
      "stepNumber": "number (required)",
      "description": "string (required)",
      "duration": "number (optional)",
      "personnel": "string (optional)",
      "hazards": [
        {
          "description": "string (required)",
          "category": "electrical|mechanical|chemical|biological|physical|ergonomic|psychosocial (required)",
          "effectScore": "number (1-100, required)",
          "exposureScore": "number (0-10, required)",
          "probabilityScore": "number (0-10, required)",
          "controlMeasures": [
            {
              "type": "elimination|substitution|engineering|administrative|ppe (required)",
              "description": "string (required)",
              "responsiblePerson": "string (required)",
              "deadline": "string (datetime, required)"
            }
          ]
        }
      ]
    }
  ],
  "validFrom": "string (datetime, required)",
  "validUntil": "string (datetime, required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "status": "draft",
    "overallRiskScore": "number",
    "createdAt": "string"
  }
}
```

---

### GET /api/tras/{traId}

Get TRA details.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "status": "string",
    "projectId": "string",
    "projectName": "string",
    "templateId": "string",
    "taskSteps": [/* array of task steps */],
    "overallRiskScore": "number",
    "overallRiskLevel": "string",
    "createdBy": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "validFrom": "string",
    "validUntil": "string"
  }
}
```

---

### PATCH /api/tras/{traId}

Update TRA details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/tras/{traId}

Delete TRA.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/tras/{traId}/approve

Approve a TRA.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "comments": "string (optional)",
  "signature": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "approved",
    "approvedBy": "string",
    "approvedAt": "string"
  }
}
```

---

### GET /api/tras/{traId}/comments

Get TRA comments.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/tras/{traId}/comments

Add comment to TRA.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "string (required)",
  "section": "string (optional)"
}
```

---

### PATCH /api/tras/{traId}/comments/{commentId}

Update TRA comment.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/tras/{traId}/comments/{commentId}

Delete TRA comment.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/tras/{traId}/signature

Add signature to TRA.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "signature": "string (required)",
  "signatureType": "string (required)"
}
```

---

### POST /api/tras/{traId}/submit

Submit TRA for approval.

**Headers:**
```
Authorization: Bearer {token}
```

---

## LMRA (Last Minute Risico Analyse) Management

### GET /api/lmra-sessions

List LMRA sessions.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `projectId`: Filter by project
- `createdBy`: Filter by creator

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "status": "in_progress|completed|stopped",
      "projectId": "string",
      "createdBy": "string",
      "createdAt": "string",
      "completedAt": "string",
      "location": {
        "latitude": "number",
        "longitude": "number",
        "accuracy": "number"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/lmra-sessions

Create a new LMRA session.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "string (required)",
  "projectId": "string (required)",
  "traId": "string (optional)"
}
```

---

### GET /api/lmra-sessions/{sessionId}

Get LMRA session details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### PATCH /api/lmra-sessions/{sessionId}

Update LMRA session.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/lmra-sessions/{sessionId}/complete

Complete LMRA session.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "assessment": "safe|caution|stop_work (required)",
  "comments": "string (optional)",
  "photos": ["string (optional)"],
  "personnel": [
    {
      "userId": "string (required)",
      "competencyVerified": "boolean (required)",
      "certifications": ["string (optional)"]
    }
  ],
  "equipment": [
    {
      "qrCode": "string (required)",
      "condition": "good|fair|poor|failed (required)",
      "inspectionDate": "string (datetime, required)"
    }
  ]
}
```

---

## Supporting Systems

### GET /api/templates

List TRA templates.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "industryCategory": "string",
      "description": "string",
      "taskSteps": [/* template task steps */],
      "isActive": "boolean",
      "createdAt": "string"
    }
  ]
}
```

---

### POST /api/templates

Create TRA template.

**Headers:**
```
Authorization: Bearer {token}
```

---

### GET /api/templates/{templateId}

Get template details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### PATCH /api/templates/{templateId}

Update template.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/templates/{templateId}

Delete template.

**Headers:**
```
Authorization: Bearer {token}
```

---

### GET /api/hazards

Search hazard database.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `q`: Search query
- `category`: Filter by category
- `limit`: Max results (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "description": "string",
      "category": "string",
      "typicalControls": ["string"]
    }
  ]
}
```

---

### GET /api/recommendations

Get control measure recommendations.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `hazardCategory`: Required
- `riskLevel`: Optional filter

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "elimination|substitution|engineering|administrative|ppe",
      "description": "string",
      "effectiveness": "high|medium|low"
    }
  ]
}
```

---

## Invitations & User Management

### GET /api/invitations

List pending invitations.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/invitations

Create invitation.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "email": "string (required)",
  "role": "string (required)",
  "organizationId": "string (required)"
}
```

---

### GET /api/invitations/{id}

Get invitation details (public endpoint).

**Success Response (200):**
```json
{
  "id": "string",
  "email": "string",
  "role": "string",
  "organizationName": "string",
  "expiresAt": "string"
}
```

---

### POST /api/invitations/{id}/accept

Accept invitation.

**Request Body:**
```json
{
  "displayName": "string (required)",
  "password": "string (required)"
}
```

---

### POST /api/invitations/{id}/decline

Decline invitation.

**Success Response (200):**
```json
{
  "success": true
}
```

---

### DELETE /api/invitations/{id}

Cancel invitation (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

---

## Reporting & Analytics

### POST /api/reports/generate

Generate custom report.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "type": "tra_summary|lmra_summary|risk_analysis|compliance (required)",
  "dateRange": {
    "start": "string (datetime, required)",
    "end": "string (datetime, required)"
  },
  "projectIds": ["string (optional)"],
  "format": "pdf|excel (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "string",
    "downloadUrl": "string",
    "expiresAt": "string"
  }
}
```

---

## Webhooks & Integrations

### GET /api/webhooks

List webhooks.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/webhooks

Create webhook.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "url": "string (required)",
  "events": ["tra.created", "tra.approved", "lmra.completed", "user.invited"],
  "secret": "string (optional)"
}
```

---

### GET /api/webhooks/{webhookId}

Get webhook details.

**Headers:**
```
Authorization: Bearer {token}
```

---

### PATCH /api/webhooks/{webhookId}

Update webhook.

**Headers:**
```
Authorization: Bearer {token}
```

---

### DELETE /api/webhooks/{webhookId}

Delete webhook.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/webhooks/{webhookId}/test

Test webhook.

**Headers:**
```
Authorization: Bearer {token}
```

---

### POST /api/webhooks/events

Webhook event delivery endpoint (called by system).

**Headers:**
```
X-Webhook-Signature: sha256={signature}
```

---

## System Administration

### GET /api/health

System health check (public).

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "string",
  "services": {
    "database": "connected",
    "auth": "connected",
    "storage": "connected"
  }
}
```

---

### GET /api/cache/stats

Get cache statistics (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEntries": "number",
    "hitRate": "number",
    "memoryUsage": "number",
    "lastCleanup": "string"
  }
}
```

---

### GET /api/security/audit

Get security audit information (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

---

## GDPR Compliance

### POST /api/gdpr/export

Export user data (GDPR Article 20).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "includeAuditLogs": "boolean (optional, default: false)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "string",
    "expiresAt": "string",
    "fileSize": "number"
  }
}
```

---

### POST /api/gdpr/delete

Request account deletion (GDPR Article 17).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "confirmation": "string (required)",
  "reason": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "deletionId": "string",
    "scheduledDeletionDate": "string",
    "gracePeriodDays": 30
  }
}
```

---

## Integration Examples

### Authentication Flow

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token, user } = await loginResponse.json();

// Store token securely
localStorage.setItem('authToken', token);

// Use token in subsequent requests
const response = await fetch('/api/tras', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-ID': user.orgId
  }
});
```

### Creating a TRA

```typescript
const createTRA = async (traData) => {
  const response = await fetch('/api/tras', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Organization-ID': orgId
    },
    body: JSON.stringify({
      title: 'Electrical Maintenance Work',
      projectId: 'proj_123',
      taskSteps: [
        {
          stepNumber: 1,
          description: 'Isolate electrical systems',
          hazards: [
            {
              description: 'Electric shock risk',
              category: 'electrical',
              effectScore: 100,
              exposureScore: 6,
              probabilityScore: 2,
              controlMeasures: [
                {
                  type: 'elimination',
                  description: 'De-energize and lockout/tagout',
                  responsiblePerson: 'user_456',
                  deadline: '2024-10-30T00:00:00Z'
                }
              ]
            }
          ]
        }
      ],
      validFrom: '2024-10-15T00:00:00Z',
      validUntil: '2024-10-16T00:00:00Z'
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('TRA created:', result.data.id);
    return result.data;
  } else {
    throw new Error(result.error.message);
  }
};
```

### LMRA Execution

```typescript
const executeLMRA = async (traId) => {
  // Create LMRA session
  const sessionResponse = await fetch('/api/lmra-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Pre-work safety check',
      projectId: 'proj_123',
      traId: traId
    })
  });

  const session = await sessionResponse.json();

  // Complete LMRA with assessment
  await fetch(`/api/lmra-sessions/${session.data.id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      assessment: 'safe',
      comments: 'All systems checked and safe to proceed',
      personnel: [
        {
          userId: 'user_456',
          competencyVerified: true,
          certifications: ['Electrical Safety', 'Lockout/Tagout']
        }
      ]
    })
  });
};
```

### Webhook Integration

```typescript
// Create webhook for TRA events
const webhookResponse = await fetch('/api/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://your-system.com/webhooks/safework',
    events: ['tra.created', 'tra.approved', 'lmra.completed'],
    secret: 'your-webhook-secret'
  })
});

const webhook = await webhookResponse.json();

// Verify webhook signature in your system
const verifyWebhook = (payload, signature, secret) => {
  const expectedSignature = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
};
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "title": "Title is required",
        "validFrom": "Date must be in the future"
      }
    },
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z",
    "documentation": "https://docs.safeworkpro.com/errors/VALIDATION_ERROR"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED` (401): Authentication missing
- `AUTH_INVALID_TOKEN` (401): Invalid or expired token
- `AUTH_INSUFFICIENT_PERMISSIONS` (403): Insufficient role permissions
- `VALIDATION_ERROR` (400): Request validation failed
- `RESOURCE_NOT_FOUND` (404): Resource doesn't exist
- `RESOURCE_CONFLICT` (409): Resource state conflict
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `SERVER_ERROR` (500): Internal server error

---

## Rate Limits

- **Authentication**: 5 requests per 15 minutes
- **Read Operations**: 100 requests per minute
- **Write Operations**: 30 requests per minute
- **File Uploads**: 10 uploads per minute
- **Report Generation**: 5 reports per minute
- **Organization**: 1000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-10-15T15:30:00Z
```

---

## Best Practices

1. **Always include Authorization header** for authenticated endpoints
2. **Handle rate limits** by checking response headers
3. **Validate data** on both client and server side
4. **Use appropriate HTTP methods** (GET for read, POST for create, etc.)
5. **Handle errors gracefully** with user-friendly messages
6. **Cache responses** where appropriate (templates, hazards)
7. **Use pagination** for large result sets
8. **Monitor API usage** for performance optimization

---

**Documentation Status**: ✅ COMPLETE - All implemented endpoints documented
**Last Updated**: October 8, 2025
**API Version**: v1 (stable)