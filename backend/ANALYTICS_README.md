# Analytics Module

## Overview
The Analytics module provides KPIs, trends, and insights for HR and Admin users with intelligent caching for performance optimization.

## Architecture

### Cache Behavior
- **Implementation**: In-memory cache using `node-cache` pattern
- **Location**: `src/services/cache.service.ts`
- **TTL**: 
  - Overview KPIs: 30 seconds
  - Attendance data: 60 seconds
  - Payroll totals: 60 seconds
- **Invalidation**: 
  - Attendance cache invalidated on check-in/checkout
  - Overview cache invalidated on leave status changes
  - Prefix-based invalidation for related keys

### Cache Service API
```typescript
// Get cached value
const value = cacheGet<T>(key);

// Set value with TTL (milliseconds)
cacheSet(key, value, 30_000);

// Invalidate single key
cacheInvalidate(key);

// Invalidate all keys with prefix
cacheInvalidatePrefix('analytics:attendance:');
```

## Endpoints

### 1. GET /v1/analytics/overview
**Description**: Returns high-level KPIs for dashboard

**Authorization**: Admin, HR

**Response**:
```json
{
  "totalEmployees": 145,
  "presentToday": 132,
  "onLeaveToday": 8,
  "pendingLeaveRequests": 12,
  "avgAttendance": 92.5
}
```

**Cache**: 30s TTL, invalidated on leave/attendance writes

**Calculation**:
- `totalEmployees`: Count of EmployeeProfile records
- `presentToday`: Count of attendance records with checkIn today
- `onLeaveToday`: Count of approved leaves overlapping today
- `pendingLeaveRequests`: Count of PENDING leave requests
- `avgAttendance`: (actual attendance / possible attendance) * 100 for current month

### 2. GET /v1/analytics/attendance?month=YYYY-MM
**Description**: Day-wise attendance counts for a month

**Authorization**: Admin, HR

**Query Parameters**:
- `month` (optional): Format YYYY-MM, defaults to current month

**Response**:
```json
[
  { "date": "2025-11-01T00:00:00.000Z", "presentCount": 140 },
  { "date": "2025-11-02T00:00:00.000Z", "presentCount": 138 },
  ...
]
```

**Cache**: 60s TTL, key includes month, invalidated on attendance writes

**Implementation**: Uses Prisma `groupBy` with fallback to manual aggregation

### 3. GET /v1/analytics/payroll?period=YYYY-MM-DD:YYYY-MM-DD
**Description**: Payroll totals for a period

**Authorization**: Admin, Payroll

**Query Parameters**:
- `period` (required): Format `YYYY-MM-DD:YYYY-MM-DD`

**Response**:
```json
{
  "gross": 1250000,
  "net": 1087500
}
```

**Cache**: 60s TTL, key includes period

**Calculation**: Sums gross and net from all payslips in payruns created within period

## Cache Invalidation Hooks

### Attendance Writes
```typescript
// In AttendanceService.checkin()
await AttendanceRepository.createCheckin(...);
AnalyticsService.invalidateAttendanceCache(); // Clears analytics:attendance:*
AnalyticsService.invalidateOverview(); // Clears analytics:overview
```

### Leave Status Changes
```typescript
// In LeavesService.approve()
await LeavesRepository.approve(...);
AnalyticsService.invalidateOverview(); // Clears analytics:overview
```

## Performance Considerations

### Why Caching?
- Analytics queries aggregate large datasets (attendance, leaves, payroll)
- Dashboard loads trigger multiple analytics calls simultaneously
- Most data changes infrequently (attendance once per day per user)
- 30-60s staleness is acceptable for dashboard KPIs

### Cache Hit Rates
- **Expected**: 80-90% for overview, 70-80% for attendance
- **Peak times**: Morning (check-ins) and end-of-day (checkouts)
- **Cache misses**: After invalidation or TTL expiry

### Optimization Strategies
1. **Prefix-based invalidation**: Clear related keys efficiently
2. **Lazy loading**: Cache populated on first request
3. **Fallback queries**: Graceful degradation if groupBy fails
4. **Error handling**: Return cached data on DB errors if available

## Testing

### Unit Tests
```bash
npm test -- analytics.spec.ts
```

**Test Coverage**:
- ✅ Overview KPIs calculation
- ✅ Attendance aggregation by day
- ✅ Payroll totals calculation
- ✅ Cache hit/miss scenarios
- ✅ Invalidation on writes
- ✅ Concurrent request handling

### Integration Tests
```bash
npm test -- --testPathPattern=analytics
```

**Test Scenarios**:
- Multiple dashboard loads (cache hits)
- Attendance write → cache invalidation → fresh data
- Leave approval → overview refresh
- Month boundary handling
- Empty data sets

### Manual Testing
```bash
# 1. Load dashboard (cache miss)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/v1/analytics/overview

# 2. Load again immediately (cache hit)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/v1/analytics/overview

# 3. Check in
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"manual"}' \
  http://localhost:4000/v1/attendance/checkin

# 4. Load dashboard again (cache miss due to invalidation)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/v1/analytics/overview
```

## Monitoring

### Cache Metrics (Future)
- Hit rate per endpoint
- Average response time (cached vs uncached)
- Cache size and memory usage
- Invalidation frequency

### Logging
```typescript
// Enable cache debug logs
process.env.LOG_LEVEL = 'debug';
```

## Future Enhancements

1. **Redis Cache**: Replace in-memory with Redis for multi-instance deployments
2. **Smart Invalidation**: Only invalidate affected date ranges
3. **Precomputed Aggregates**: Daily batch job to precompute common queries
4. **Query Optimization**: Use materialized views for complex aggregations
5. **Cache Warming**: Preload cache on server start
6. **Metrics Dashboard**: Real-time cache performance monitoring

## Troubleshooting

### Cache Not Invalidating
- Check if invalidation hooks are called in service methods
- Verify prefix matches cache keys
- Check for errors in invalidation logic (wrapped in try-catch)

### Stale Data
- Reduce TTL if data freshness is critical
- Ensure invalidation hooks are triggered on all write paths
- Check for race conditions in concurrent writes

### Memory Issues
- Monitor cache size with `cache.keys().length`
- Implement LRU eviction if memory grows
- Consider moving to Redis for large datasets

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
