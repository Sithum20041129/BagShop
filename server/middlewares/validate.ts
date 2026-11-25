import type { Context } from 'hono';
import type { z } from 'zod';
import { AppError } from './error';

export async function parseJsonBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new AppError('Invalid JSON request body', 400);
  }
  return schema.parse(raw);
}
