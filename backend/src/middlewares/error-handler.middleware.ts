/**
 * Centralized Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data provided',
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
    });
  }

  // Handle multer errors (file upload)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  }

  // Default error response
  const statusCode = (err as any).status || (err as any).statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
) {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        error: `A record with this ${field} already exists`,
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(400).json({
        error: 'Invalid reference to related record',
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        error: 'Record not found',
      });

    case 'P2014':
      // Invalid ID
      return res.status(400).json({
        error: 'Invalid ID provided',
      });

    case 'P2011':
      // Null constraint violation
      const nullField = err.meta?.column_name || 'field';
      return res.status(400).json({
        error: `${nullField} is required`,
      });

    case 'P2000':
      // Value too long
      return res.status(400).json({
        error: 'Value is too long for the field',
      });

    case 'P2001':
      // Record does not exist
      return res.status(404).json({
        error: 'The record does not exist',
      });

    case 'P2015':
      // Related record not found
      return res.status(404).json({
        error: 'Related record not found',
      });

    case 'P2016':
      // Query interpretation error
      return res.status(400).json({
        error: 'Invalid query parameters',
      });

    case 'P2021':
      // Table does not exist
      return res.status(500).json({
        error: 'Database configuration error',
      });

    case 'P2022':
      // Column does not exist
      return res.status(500).json({
        error: 'Database schema error',
      });

    default:
      console.error('Unhandled Prisma error:', err.code, err.message);
      return res.status(500).json({
        error: 'Database error occurred',
      });
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
