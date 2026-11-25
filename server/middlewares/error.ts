import type { Context } from 'hono';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return c.json(
      {
        success: false,
        message: firstIssue?.message || 'Validation failed',
        errors: err.issues,
      },
      400
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }

  console.error('[Server Error]', err);
  return c.json(
    {
      success: false,
      message: err.message || 'Internal server error',
    },
    500
  );
}
