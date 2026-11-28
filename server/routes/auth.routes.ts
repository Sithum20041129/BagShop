import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyClerkRequest, syncClerkUserToDb } from '../middlewares/clerk-auth';

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get('/me', async (c) => {
  const verified = await verifyClerkRequest(c);
  if (!verified) {
    return c.json({ success: false, message: 'Authentication required' }, 401);
  }

  const user = await syncClerkUserToDb(c, verified.clerkId);
  if (!user) {
    return c.json({ success: false, message: 'Unable to sync Clerk user' }, 500);
  }

  return c.json({ success: true, user });
});

export default authRoutes;
