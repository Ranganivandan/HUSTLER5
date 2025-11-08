# Admin & Audit Module

## Overview
The Admin module provides system administration capabilities including audit log tracking, anomaly detection, and user management with comprehensive audit trails.

## Audit Log Provenance

### Implementation Strategy
**Service-Based Audit Logging** (Current Implementation)

We use service-level audit logging rather than database triggers for the following reasons:

1. **Flexibility**: Can log application-level context (user role, IP, user agent)
2. **Portability**: Works across different databases (PostgreSQL, MySQL, SQLite)
3. **Control**: Explicit logging in business logic, easier to debug
4. **Context**: Access to full request context and business rules

### Alternative: Database Triggers
Database triggers could be added for:
- Automatic logging of all table changes
- Guaranteed audit trail even if service fails
- Lower application overhead

**Migration Path**:
```sql
-- Example trigger for User table
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditLog" (action, entity, "entityId", meta)
  VALUES (
    TG_OP,
    'User',
    NEW.id,
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON "User"
FOR EACH ROW EXECUTE FUNCTION audit_user_changes();
```

## Architecture

### Audit Log Schema
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entity    String?  // User, Attendance, LeaveRequest, etc.
  entityId  String?  // ID of affected record
  ip        String?
  userAgent String?
  meta      Json?    // Additional context
  createdAt DateTime @default(now())
}
```

### Audit Service API
```typescript
// Create audit log
await AuditRepository.create({
  userId: req.user.id,
  action: 'DELETE',
  entity: 'User',
  entityId: userId,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  meta: { soft: true, reason: 'Inactive user cleanup' }
});
```

## Endpoints

### 1. GET /v1/admin/audit
**Description**: Retrieve paginated audit logs with filters

**Authorization**: Admin only

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 50
- `entity` (optional): Filter by entity (User, Attendance, etc.)
- `action` (optional): Filter by action (CREATE, UPDATE, DELETE)
- `userId` (optional): Filter by user who performed action

**Response**:
```json
{
  "items": [
    {
      "id": "clx123...",
      "userId": "user123",
      "user": { "name": "Admin User", "email": "admin@workzen.com" },
      "action": "DELETE",
      "entity": "User",
      "entityId": "user456",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "meta": { "soft": true },
      "createdAt": "2025-11-08T14:30:22.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

**Use Cases**:
- Security audits
- Compliance reporting
- Debugging user issues
- Tracking system changes

### 2. GET /v1/admin/anomalies
**Description**: Detect attendance anomalies (late check-ins)

**Authorization**: Admin only

**Response**:
```json
[
  {
    "userId": "user123",
    "userName": "Rajesh Kumar",
    "employeeCode": "WZ-1001",
    "lateCount": 5,
    "dates": ["2025-11-01", "2025-11-03", "2025-11-05", "2025-11-06", "2025-11-08"]
  }
]
```

**Detection Logic**:
- Late check-in: After 9:30 AM
- Threshold: More than 3 late check-ins in current month
- Includes: Date list for investigation

**Use Cases**:
- Identify chronic late arrivals
- HR intervention triggers
- Performance review data
- Policy enforcement

### 3. DELETE /v1/admin/users/:id
**Description**: Soft delete user (set isActive = false)

**Authorization**: Admin only

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@workzen.com",
    "isActive": false
  }
}
```

**Behavior**:
1. Sets `isActive = false` on User record
2. Creates audit log entry
3. Preserves all related data (attendance, leaves, payslips)
4. User cannot login but data remains for reporting
5. TODO: Enqueue `user_cleanup` job for delayed hard delete

**Audit Trail**:
```json
{
  "action": "DELETE",
  "entity": "User",
  "entityId": "user123",
  "meta": { "soft": true }
}
```

## Audit Logging Best Practices

### What to Log
✅ **Always Log**:
- User creation/deletion
- Role changes
- Sensitive data access (payroll, personal info)
- Configuration changes
- Failed login attempts
- Permission changes

❌ **Don't Log**:
- Routine data reads (too noisy)
- Health check endpoints
- Static asset requests
- Passwords or sensitive credentials

### When to Log
```typescript
// Example: User update
export async function updateUser(id: string, data: any, requestor: User) {
  const oldUser = await prisma.user.findUnique({ where: { id } });
  const newUser = await prisma.user.update({ where: { id }, data });
  
  // Log after successful update
  await AuditRepository.create({
    userId: requestor.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    meta: {
      changes: diff(oldUser, newUser), // Only log what changed
      reason: data.reason // If provided
    }
  });
  
  return newUser;
}
```

### Audit Log Retention
- **Short-term**: 90 days in primary database
- **Long-term**: Archive to cold storage (S3, etc.)
- **Compliance**: Retain for legal requirements (varies by region)

## Anomaly Detection

### Current Implementation
**Late Check-ins**: Users checking in after 9:30 AM

### Future Anomalies
1. **Frequent Leave Patterns**: Leaves on Mondays/Fridays
2. **Attendance Gaps**: Missing check-ins without approved leave
3. **Unusual Hours**: Check-ins outside business hours
4. **Location Anomalies**: Check-ins from unexpected locations (if GPS enabled)
5. **Payroll Discrepancies**: Unusual salary changes

### Custom Anomaly Rules
```typescript
// Example: Add custom anomaly detector
export async function detectCustomAnomaly(rule: AnomalyRule) {
  const data = await prisma.$queryRaw`
    SELECT * FROM "Attendance"
    WHERE ${rule.condition}
  `;
  
  return data.filter(rule.filter).map(rule.transform);
}
```

## Testing

### Integration Tests
```bash
npm test -- admin.spec.ts
```

**Test Coverage**:
- ✅ Audit log creation on user operations
- ✅ Audit log retrieval with filters
- ✅ Anomaly detection accuracy
- ✅ Soft delete preserves data
- ✅ Authorization checks (admin-only)
- ✅ Pagination and sorting

### Test Scenarios
```typescript
describe('Admin Module', () => {
  it('should create audit log on user deletion', async () => {
    await adminService.deleteUser('admin', userId);
    const logs = await auditRepository.list(1, 10, { action: 'DELETE' });
    expect(logs.items[0].entityId).toBe(userId);
  });

  it('should detect late check-ins', async () => {
    // Create attendance records with late check-ins
    await createLateCheckIn(userId, '2025-11-01', '10:00');
    await createLateCheckIn(userId, '2025-11-02', '10:15');
    await createLateCheckIn(userId, '2025-11-03', '09:45');
    await createLateCheckIn(userId, '2025-11-04', '10:30');
    
    const anomalies = await adminService.getAnomalies('admin');
    expect(anomalies.find(a => a.userId === userId).lateCount).toBe(4);
  });
});
```

## Security Considerations

### Audit Log Protection
- **Immutable**: Audit logs should never be updated or deleted
- **Access Control**: Only admins can view audit logs
- **Encryption**: Consider encrypting sensitive meta fields
- **Integrity**: Use checksums to detect tampering

### User Deletion
- **Soft Delete**: Preserves audit trail and data integrity
- **Hard Delete**: Only after retention period, requires admin approval
- **Cascade**: Related data (attendance, leaves) remains for reporting
- **Anonymization**: Option to anonymize instead of delete (GDPR)

## Monitoring & Alerts

### Audit Log Alerts
- **Failed Login Attempts**: >5 in 10 minutes
- **Bulk Deletions**: >10 users deleted in 1 hour
- **Permission Changes**: Any role escalation
- **After-Hours Access**: Admin actions outside business hours

### Anomaly Alerts
- **High Late Count**: User with >5 late check-ins in a month
- **Pattern Detection**: Suspicious leave patterns
- **Data Integrity**: Missing attendance records

## Future Enhancements

1. **Job Queue Integration**: pg-boss for async user cleanup
2. **Audit Log Archival**: Automated archival to S3/cold storage
3. **Advanced Anomalies**: ML-based pattern detection
4. **Audit Log Search**: Full-text search with Elasticsearch
5. **Compliance Reports**: Automated GDPR/SOC2 reports
6. **Real-time Alerts**: WebSocket notifications for critical events
7. **Audit Log Visualization**: Timeline view, relationship graphs

## Compliance

### GDPR
- Right to be forgotten: Soft delete + anonymization
- Data portability: Export user data in JSON
- Audit trail: Track all data access and modifications

### SOC2
- Access logs: Who accessed what and when
- Change logs: All configuration changes
- Retention: Audit logs retained per policy

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
