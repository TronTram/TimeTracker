// Custom error classes and error handling utilities
import { ZodError } from 'zod';

// Base error class for application-specific errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication and authorization errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_REQUIRED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }

  static fromZodError(zodError: ZodError): ValidationError {
    const errors: Record<string, string[]> = {};
    
    zodError.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    return new ValidationError('Validation failed', errors);
  }
}

// Resource not found errors
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

// Conflict errors (e.g., duplicate resources)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', true, context);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

// Error response type for API responses
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: Date;
    errors?: Record<string, string[]>; // For validation errors
    context?: Record<string, any>;
  };
}

// Success response type for API responses
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Combined response type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Error handler utility
export class ErrorHandler {
  static handle(error: unknown): ErrorResponse {
    console.error('Error occurred:', error);

    // Handle known app errors
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
          statusCode: error.statusCode,
          timestamp: error.timestamp,
          ...(error instanceof ValidationError && { errors: error.errors }),
          ...(error.context && { context: error.context }),
        },
      };
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = ValidationError.fromZodError(error);
      return ErrorHandler.handle(validationError);
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      return ErrorHandler.handlePrismaError(error as any);
    }

    // Handle unknown errors
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        timestamp: new Date(),
      },
    };
  }

  private static handlePrismaError(error: any): ErrorResponse {
    const { code, message } = error;

    switch (code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target;
        const field = Array.isArray(target) ? target[0] : target;
        return {
          success: false,
          error: {
            message: `A record with this ${field} already exists`,
            code: 'DUPLICATE_RECORD',
            statusCode: 409,
            timestamp: new Date(),
          },
        };

      case 'P2025':
        // Record not found
        return {
          success: false,
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
            statusCode: 404,
            timestamp: new Date(),
          },
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          success: false,
          error: {
            message: 'Cannot delete record due to existing references',
            code: 'FOREIGN_KEY_CONSTRAINT',
            statusCode: 409,
            timestamp: new Date(),
          },
        };

      case 'P2034':
        // Transaction failed due to write conflict
        return {
          success: false,
          error: {
            message: 'Operation failed due to a conflict. Please try again.',
            code: 'WRITE_CONFLICT',
            statusCode: 409,
            timestamp: new Date(),
          },
        };

      default:
        return {
          success: false,
          error: {
            message: 'Database operation failed',
            code: 'DATABASE_ERROR',
            statusCode: 500,
            timestamp: new Date(),
            context: { prismaCode: code, prismaMessage: message },
          },
        };
    }
  }

  // Helper to create success responses
  static success<T>(data: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  // Helper to throw validation errors
  static throwValidation(message: string, errors: Record<string, string[]>) {
    throw new ValidationError(message, errors);
  }

  // Helper to throw not found errors
  static throwNotFound(resource: string, identifier?: string) {
    throw new NotFoundError(resource, identifier);
  }

  // Helper to throw authorization errors
  static throwUnauthorized(message?: string) {
    throw new AuthenticationError(message);
  }

  // Helper to throw forbidden errors
  static throwForbidden(message?: string) {
    throw new AuthorizationError(message);
  }
}

// Utility to wrap async functions with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<ApiResponse<R>> {
  return async (...args: T): Promise<ApiResponse<R>> => {
    try {
      const result = await fn(...args);
      return ErrorHandler.success(result);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };
}

// Utility for retrying operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// =============================================================================
// Action Response Helpers
// =============================================================================

/**
 * Create a successful action response
 */
export function createActionResponse<T>(data: T, message?: string): ApiResponse<T> {
  return ErrorHandler.success(data, message);
}

/**
 * Handle errors in server actions
 */
export function handleActionError(error: unknown, fallbackMessage: string): ApiResponse<never> {
  console.error('Action error:', error);
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: new Date(),
      },
    };
  }

  return ErrorHandler.handle(error);
}
