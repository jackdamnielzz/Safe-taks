# Backup & Restore Guide - SafeWork Pro

## Overview

SafeWork Pro implements a comprehensive automated backup system for all Firestore data with 30-day retention and point-in-time recovery capabilities.

## Automated Backup System

### Daily Scheduled Backups

- **Schedule**: Every day at 3:00 AM UTC
- **Retention**: 30 days (automatically cleaned up)
- **Collections Backed Up**:
  - organizations
  - users
  - projects
  - tras
  - templates
  - lmra-sessions
  - hazards
  - controls
  - invitations
  - uploads
  - audit-logs
  - webhooks

### Backup Storage

- **Location**: Google Cloud Storage bucket (`{project-id}-backups`)
- **Format**: Firestore export format
- **Naming**: `backup-{type}-{timestamp}`
- **Metadata**: Tracked in `backup-metadata` collection

## Manual Backup Creation

### Via Admin UI

1. Navigate to **Admin Hub** → **Backup & Restore**
2. Click **Create Backup Now**
3. Confirm the operation
4. Wait for completion notification

### Via Cloud Function

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createBackup = httpsCallable(functions, 'createBackupOnDemand');

const result = await createBackup();
console.log('Backup created:', result.data.backupName);
```

## Listing Available Backups

### Via Admin UI

1. Navigate to **Admin Hub** → **Backup & Restore**
2. View list of all available backups
3. Filter by date, type (scheduled/manual), or status

### Via Cloud Function

```javascript
const listBackups = httpsCallable(functions, 'listBackups');

const result = await listBackups({ limit: 50 });
console.log('Available backups:', result.data.backups);
```

## Restoring from Backup

### ⚠️ WARNING: Destructive Operation

Restoring from a backup will **overwrite all current data** in the specified collections. This operation cannot be undone.

### Prerequisites

1. **Create a current backup first** before restoring
2. **Notify all users** of planned downtime
3. **Verify backup integrity** before proceeding
4. **Have rollback plan** ready

### Restoration Process

#### Via Admin UI

1. Navigate to **Admin Hub** → **Backup & Restore**
2. Find the backup you want to restore
3. Click **Restore** button
4. **Read all warnings carefully**
5. Type confirmation phrase: `RESTORE BACKUP`
6. Click **Confirm Restore**
7. Wait for completion (may take several minutes)

#### Via Cloud Function

```javascript
const restoreBackup = httpsCallable(functions, 'restoreFromBackup');

const result = await restoreBackup({
  backupName: 'backup-manual-2025-10-21T15-30-00-000Z'
});

console.log('Restoration result:', result.data);
```

## Backup Metadata

Each backup includes the following metadata:

```typescript
interface BackupMetadata {
  timestamp: Timestamp;           // When backup was created
  type: 'scheduled' | 'manual';   // Backup type
  triggeredBy: string;            // User ID or 'system'
  status: 'in_progress' | 'completed' | 'failed';
  collections: string[];          // Collections included
  backupPath: string;             // GCS path
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;              // Milliseconds
  documentCount?: number;
  sizeBytes?: number;
  error?: string;                 // If failed
}
```

## Backup Verification

### Manual Verification Steps

1. **Check backup metadata**:
   ```
   - Status should be 'completed'
   - No error messages
   - Reasonable duration
   ```

2. **Verify GCS bucket**:
   - Navigate to Google Cloud Console
   - Open Storage → Buckets
   - Find `{project-id}-backups`
   - Verify backup folder exists

3. **Test restoration** (optional):
   - Create test Firebase project
   - Restore backup to test project
   - Verify data integrity

## Disaster Recovery Procedures

### Scenario 1: Data Corruption Detected

1. **Immediate Actions**:
   - Put application in maintenance mode
   - Notify stakeholders
   - Identify last known good backup

2. **Recovery Steps**:
   - Create emergency backup of current state
   - Restore from last known good backup
   - Verify data integrity
   - Resume normal operations
   - Document incident

### Scenario 2: Accidental Data Deletion

1. **Assessment**:
   - Determine scope of deletion
   - Identify affected collections/documents
   - Find backup before deletion

2. **Selective Recovery**:
   - Restore full backup to temporary project
   - Export only affected data
   - Import to production
   - Verify restoration
   - Document recovery

### Scenario 3: Complete System Failure

1. **Emergency Response**:
   - Activate disaster recovery team
   - Assess system status
   - Identify most recent backup

2. **Full System Restore**:
   - Create new Firebase project (if needed)
   - Configure all services
   - Restore from backup
   - Update DNS/endpoints
   - Verify all functionality
   - Resume operations

## Retention Policy

### Standard Retention: 30 Days

- Daily backups kept for 30 days
- Automatic cleanup of older backups
- Metadata preserved for audit trail

### Long-term Archival (Optional)

For compliance or audit requirements:

1. **Manual Archive Creation**:
   - Copy backup from GCS to archive storage
   - Document archive date and reason
   - Store metadata separately

2. **Archive Storage**:
   - Google Cloud Storage Archive class
   - Reduced cost for long-term storage
   - Retrieval time: hours to days

## Monitoring & Alerts

### Backup Success Monitoring

Configure Cloud Monitoring alerts for:

- **Backup failures**: Alert if backup status = 'failed'
- **Missing backups**: Alert if no backup in 25+ hours
- **Long duration**: Alert if backup takes >1 hour

### Alert Configuration

```javascript
// Example alert condition
{
  conditionThreshold: {
    filter: 'resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_count" AND resource.labels.function_name="scheduledBackup" AND metric.labels.status="error"',
    comparison: 'COMPARISON_GT',
    thresholdValue: 0,
    duration: '60s'
  },
  displayName: 'Backup Failed Alert',
  notification_channels: ['your-notification-channel-id']
}
```

## Best Practices

### 1. Regular Testing

- **Monthly**: Verify automated backups completing
- **Quarterly**: Test full restoration process
- **Annually**: Disaster recovery drill

### 2. Documentation

- Keep backup logs for audit trail
- Document all manual backups (reason, who, when)
- Maintain recovery runbooks

### 3. Security

- **Access Control**: Only admins can restore
- **Audit Logging**: All backup operations logged
- **Encryption**: Backups encrypted at rest

### 4. Performance

- Schedule backups during low-traffic periods
- Monitor backup duration trends
- Optimize collection sizes if needed

## Troubleshooting

### Backup Failed

**Symptoms**: Backup status = 'failed', error message in metadata

**Common Causes**:
- Insufficient permissions
- GCS bucket full/missing
- Firestore export quota exceeded

**Solutions**:
1. Check error message in backup metadata
2. Verify GCS bucket permissions
3. Check Firestore export quota
4. Retry manual backup
5. Contact support if persistent

### Restoration Incomplete

**Symptoms**: Some data missing after restoration

**Solutions**:
1. Check backup metadata for collection list
2. Verify backup completed successfully
3. Check for collection name changes
4. Re-run restoration if safe
5. Restore from different backup

### Slow Backup Performance

**Symptoms**: Backups taking >1 hour

**Solutions**:
1. Check total document count
2. Review collection sizes
3. Consider archiving old data
4. Increase Cloud Function timeout
5. Optimize Firestore structure

## CLI Commands

### Create Manual Backup

```bash
firebase deploy --only functions:createBackupOnDemand
```

### List Backups

```bash
# Via gcloud CLI
gsutil ls gs://{project-id}-backups/
```

### Deploy Backup Functions

```bash
cd functions
npm run build
firebase deploy --only functions:scheduledBackup,functions:createBackupOnDemand,functions:listBackups,functions:restoreFromBackup
```

## Compliance & Audit

### GDPR Compliance

- User data included in backups
- 30-day retention aligns with requirements
- Data export capability for user requests
- Backup deletion on request possible

### Audit Trail

All backup operations logged in `audit-logs` collection:

```javascript
{
  timestamp: Timestamp,
  actor: 'user-id-or-system',
  action: 'backup_created' | 'backup_restored',
  category: 'security',
  severity: 'critical',
  subject: 'backup-name',
  metadata: {
    backupPath: string,
    collections: string[]
  }
}
```

## Support & Contact

For backup-related issues:

1. **Check documentation**: This guide + Firebase docs
2. **Review logs**: Check Cloud Functions logs
3. **Contact admin**: Notify system administrator
4. **Emergency**: Use emergency contact procedures

## Appendix

### Firestore Export Format

Backups use Firestore's native export format:
- Binary protobuf format
- Includes all document data
- Preserves subcollections
- Maintains document structure

### Recovery Time Objectives

- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours (daily backups)
- **Restoration Time**: 30 minutes - 2 hours (depending on size)

### Cost Considerations

- **Storage**: ~€0.02/GB/month (Standard Storage)
- **Export Operations**: Free (within quota)
- **Import Operations**: Free (within quota)
- **Network Egress**: May apply for cross-region

---

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Maintained by**: SafeWork Pro DevOps Team
