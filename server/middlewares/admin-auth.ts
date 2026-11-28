import type { Context, Next } from 'hono';
import type { Env } from '../types';
import { verifyClerkRequest, syncClerkUserToDb } from './clerk-auth';

/**
 * Clerk RBAC Admin Middleware:
 * Verifies the Clerk Bearer JWT and ensures the user has role === 'ADMIN'.
 */
export async function adminAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const clerkAuth = await verifyClerkRequest(c);
  if (!clerkAuth) {
    return c.json({ success: false, message: 'Authentication required.' }, 401);
  }

  if (clerkAuth.roleFromClaims?.toUpperCase() === 'ADMIN') {
    await next();
    return;
  }

  const dbUser = await syncClerkUserToDb(c, clerkAuth.clerkId);
  if (dbUser?.role === 'ADMIN') {
    await next();
    return;
  }

  return c.json({ success: false, message: 'Admin privileges required.' }, 403);
}
