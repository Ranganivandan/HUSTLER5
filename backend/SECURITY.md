# Security Implementation Guide

## Overview
This document outlines the comprehensive security measures implemented in the backend API to protect against common vulnerabilities and attacks.

## 🛡️ Security Layers

### 1. Input Validation & Sanitization

#### Automatic Sanitization Middleware
**File**: `middlewares/sanitize.middleware.ts`

All incoming requests are automatically sanitized to prevent:
- ✅ **SQL Injection** - Detects and blocks SQL patterns
- ✅ **XSS (Cross-Site Scripting)** - Removes malicious scripts
- ✅ **Path Traversal** - Prevents directory traversal attacks
- ✅ **Invalid Characters** - Removes control characters and null bytes
- ✅ **Invalid Field Names** - Only allows alphanumeric field names

**Patterns Detected**:
```typescript
SQL Injection:
- SELECT, INSERT, UPDATE, DELETE, DROP, etc.
- --, ;, /*, */, xp_, sp_

XSS:
- <script>, <iframe>, javascript:
- onclick, onerror, etc.
- <embed>, <object>

Path Traversal:
- ../, ..\, %2e%2e, %252e%252e
```

#### Zod Schema Validation
**File**: `dto/*.dto.ts`

Strict validation rules for all inputs:

**Email Validation**:
- Valid email format
- Max 255 characters
- Local part max 64 characters
- Domain must have valid TLD
- Automatically trimmed and lowercased

**Password Validation**:
- Minimum 8 characters
- Maximum 100 characters
- Must contain at least one letter
- Must contain at least one number

**Name Validation**:
- 2-100 characters
- Only letters, spaces, hyphens, apostrophes
- No special characters or numbers

**UUID Validation**:
- Valid UUID v4 format
- Lowercase normalized

### 2. Error Handling

#### Centralized Error Handler
**File**: `middlewares/error-handler.middleware.ts`

**Prevents Information Leakage**:
- ✅ No stack traces in production
- ✅ Generic error messages for security issues
- ✅ Detailed logging for debugging
- ✅ Consistent error format

**Handled Error Types**:
- Prisma database errors (P2002, P2003, etc.)
- Zod validation errors
- JWT authentication errors
- Custom application errors
- Generic exceptions

**Example Responses**:
```json
// Duplicate email (P2002)
{
  "error": "A record with this email already exists"
}

// Validation error
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}

// Authentication error
{
  "error": "Invalid credentials"
}
```

### 3. Request Security

#### Size Limits
**File**: `app.ts`

```typescript
- JSON body: 2MB max
- URL-encoded: 2MB max
- Parameters: 100 max
- Strict JSON parsing (arrays/objects only)
```

#### Security Headers (Helmet)
```typescript
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy
```

#### CORS Configuration
```typescript
- Specific origins (configurable)
- Credentials support
- Limited methods
- Controlled headers
```

### 4. Authentication & Authorization

#### JWT Security
- Short-lived access tokens (1 hour)
- Refresh token rotation
- Secure HTTP-only cookies
- Token validation on every request

#### Rate Limiting
**File**: `services/auth.service.ts`

```typescript
- 5 login attempts per 5 minutes
- Per-email tracking
- 429 Too Many Requests response
```

#### Password Security
- Bcrypt hashing (10 rounds)
- Minimum complexity requirements
- No password in responses
- Session revocation on password change

### 5. Database Security

#### Prisma ORM Protection
- ✅ **Parameterized Queries** - Automatic SQL injection prevention
- ✅ **Type Safety** - TypeScript validation
- ✅ **Constraint Handling** - Graceful error handling

#### Sensitive Data
- Passwords: Bcrypt hashed
- Tokens: Hashed before storage
- No plain-text credentials

### 6. API Security Best Practices

#### Input Validation Flow
```
Request → Sanitization → Zod Validation → Business Logic → Response
```

#### Error Handling Flow
```
Error → Error Handler → Log → Sanitized Response
```

## 🚨 Attack Prevention

### SQL Injection
**Prevention**:
1. Prisma ORM (parameterized queries)
2. Input sanitization middleware
3. Pattern detection and blocking

**Example**:
```typescript
// Blocked automatically
email: "admin'--"
email: "1' OR '1'='1"
```

### XSS (Cross-Site Scripting)
**Prevention**:
1. Input sanitization
2. Script tag detection
3. Event handler blocking

**Example**:
```typescript
// Blocked automatically
name: "<script>alert('xss')</script>"
name: "onclick=alert('xss')"
```

### Path Traversal
**Prevention**:
1. Pattern detection
2. Path normalization
3. Whitelist validation

**Example**:
```typescript
// Blocked automatically
file: "../../etc/passwd"
file: "%2e%2e%2f"
```

### NoSQL Injection
**Prevention**:
1. Prisma type safety
2. Object validation
3. Field name validation

### CSRF (Cross-Site Request Forgery)
**Prevention**:
1. SameSite cookies
2. CORS restrictions
3. Token-based auth

### Brute Force
**Prevention**:
1. Rate limiting
2. Account lockout (5 attempts)
3. Exponential backoff

## 📝 Validation Examples

### Valid Inputs
```typescript
✅ email: "user@example.com"
✅ password: "SecurePass123"
✅ name: "John O'Brien-Smith"
✅ id: "550e8400-e29b-41d4-a716-446655440000"
```

### Invalid Inputs (Rejected)
```typescript
❌ email: "not-an-email"
❌ email: "user@" (no domain)
❌ password: "short" (< 8 chars)
❌ password: "noNumbers" (no digits)
❌ name: "User123" (contains numbers)
❌ name: "User<script>" (XSS attempt)
❌ id: "not-a-uuid"
```

## 🔍 Security Checklist

- [x] Input validation on all endpoints
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF protection
- [x] Rate limiting
- [x] Secure password hashing
- [x] JWT token security
- [x] Error message sanitization
- [x] Request size limits
- [x] Security headers
- [x] CORS configuration
- [x] Path traversal prevention
- [x] Type validation
- [x] Database constraint handling

## 🚀 Usage

### Adding Validation to New Endpoints

1. **Create Zod Schema**:
```typescript
// dto/myfeature.dto.ts
export const mySchema = z.object({
  email: emailSchema,
  name: nameSchema,
});
```

2. **Use in Controller**:
```typescript
export const myHandler = asyncHandler(async (req, res) => {
  const parsed = mySchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid data');
  // ... business logic
});
```

3. **Automatic Protection**:
- Sanitization middleware runs automatically
- Error handler catches all errors
- Prisma handles SQL injection

## 📊 Monitoring

### Error Logs
All errors are logged with context:
```typescript
{
  name: 'ValidationError',
  message: 'Invalid email format',
  path: '/v1/auth/signup',
  method: 'POST'
}
```

### Security Events
Monitor for:
- Multiple validation failures
- Rate limit hits
- SQL injection attempts
- XSS attempts
- Authentication failures

## 🔄 Updates

When adding new features:
1. Create Zod validation schema
2. Use `asyncHandler` wrapper
3. Throw proper error classes
4. Test with malicious inputs
5. Update this documentation

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zod Documentation](https://zod.dev/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Helmet.js](https://helmetjs.github.io/)
