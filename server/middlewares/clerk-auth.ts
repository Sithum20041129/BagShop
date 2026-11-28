import type { Context } from 'hono';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import type { Env } from '../types';
import { createDb } from '../db';
import { users } from '../db/schema';

export interface ClerkVerifiedContext {
  clerkId: string;
  roleFromClaims?: string;
}

export async function verifyClerkRequest(
  c: Context<{ Bindings: Env }>
): Promise<ClerkVerifiedContext | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  const secretKey = c.env.CLERK_SECRET_KEY;
  if (!token || !secretKey) {
    return null;
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload?.sub) return null;

    const meta = payload.public_metadata as { role?: string } | undefined;
    return {
      clerkId: payload.sub,
      roleFromClaims: meta?.role,
    };
  } catch (err) {
    console.error('[Clerk verifyToken error]', err);
    return null;
  }
}

export async function syncClerkUserToDb(c: Context<{ Bindings: Env }>, clerkId: string) {
  const secretKey = c.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  const clerkClient = createClerkClient({ secretKey });
  const clerkUser = await clerkClient.users.getUser(clerkId);

  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    `${clerkId}@clerk.local`;

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    clerkUser.username ||
    primaryEmail.split('@')[0];

  const metaRole = (clerkUser.publicMetadata as { role?: string } | undefined)?.role;
  const role: 'CUSTOMER' | 'ADMIN' =
    metaRole?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';

  const db = createDb(c.env.DB);
  const existingByClerk = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingByClerk[0]) {
    // Always sync role, name, and email in case they were updated in Clerk Dashboard
    if (
      existingByClerk[0].role !== role ||
      existingByClerk[0].name !== fullName ||
      existingByClerk[0].email !== primaryEmail.toLowerCase()
    ) {
      const updated = await db
        .update(users)
        .set({
          role,
          name: fullName,
          email: primaryEmail.toLowerCase(),
        })
        .where(eq(users.id, existingByClerk[0].id))
        .returning();
      return updated[0];
    }
    return existingByClerk[0];
  }

  const byEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, primaryEmail.toLowerCase()))
    .limit(1);

  if (byEmail[0]) {
    const updated = await db
      .update(users)
      .set({ clerkId, name: fullName, role })
      .where(eq(users.id, byEmail[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db
    .insert(users)
    .values({
      clerkId,
      email: primaryEmail.toLowerCase(),
      name: fullName,
      role,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return inserted[0];
}
