/**
 * Input Sanitization Middleware
 * Protects against XSS, SQL injection, and malicious input
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;
  
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Check for SQL injection patterns
 */
function containsSQLInjection(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('|('')|;|--|\/\*|\*\/)/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
}

/**
 * Check for XSS patterns
 */
function containsXSS(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Check for path traversal attempts
 */
function containsPathTraversal(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  const pathPatterns = [
    /\.\.[\/\\]/g,
    /[\/\\]\.\./g,
    /%2e%2e/gi,
    /%252e%252e/gi,
  ];
  
  return pathPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate and sanitize object recursively
 */
function sanitizeObject(obj: any, path: string = ''): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check for malicious patterns
    if (containsSQLInjection(obj)) {
      throw new ValidationError(`Potential SQL injection detected in ${path || 'input'}`);
    }
    if (containsXSS(obj)) {
      throw new ValidationError(`Potential XSS attack detected in ${path || 'input'}`);
    }
    if (containsPathTraversal(obj)) {
      throw new ValidationError(`Path traversal attempt detected in ${path || 'input'}`);
    }
    
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number') {
    // Check for NaN and Infinity
    if (!Number.isFinite(obj)) {
      throw new ValidationError(`Invalid number value in ${path || 'input'}`);
    }
    return obj;
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => 
      sanitizeObject(item, `${path}[${index}]`)
    );
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Validate key names - allow alphanumeric, underscore, hyphen, and dot for nested objects
      // Also allow common safe characters used in JSON keys
      if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
        throw new ValidationError(`Invalid field name: ${key}`);
      }
      
      // Additional check: prevent keys that look like path traversal
      if (key.includes('..') || key.startsWith('.') || key.endsWith('.')) {
        throw new ValidationError(`Invalid field name: ${key}`);
      }
      
      const newPath = path ? `${path}.${key}` : key;
      sanitized[key] = sanitizeObject(value, newPath);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, 'body');
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, 'query');
    }
    
    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, 'params');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Strict sanitization for specific fields (emails, usernames, etc.)
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string');
  }
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Invalid email format');
  }
  
  // Check for suspicious patterns
  if (containsSQLInjection(sanitized) || containsXSS(sanitized)) {
    throw new ValidationError('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize username/name fields
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    throw new ValidationError('Name must be a string');
  }
  
  const sanitized = name.trim();
  
  // Allow only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    throw new ValidationError('Name contains invalid characters');
  }
  
  // Check length
  if (sanitized.length < 2 || sanitized.length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters');
  }
  
  return sanitized;
}

/**
 * Sanitize and validate UUID
 */
export function sanitizeUUID(id: string): string {
  if (typeof id !== 'string') {
    throw new ValidationError('ID must be a string');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid ID format');
  }
  
  return id.toLowerCase();
}
