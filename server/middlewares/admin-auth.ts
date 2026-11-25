import type { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../types';

export const ADMIN_COOKIE_NAME = 'bagshop_admin_session';

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function verifyPasscodeConstantTime(input: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(input);
  const b = encoder.encode(expected);
  if (a.length !== b.length) {
    // Compare against expected anyway to avoid early length timing leak
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

async function signValue(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${payload}.${sigHex}`;
}

async function verifySignedValue(token: string, secret: string): Promise<string | null> {
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= 0) return null;
  const payload = token.slice(0, dotIdx);
  const expected = await signValue(payload, secret);
  const encoder = new TextEncoder();
  if (!timingSafeEqual(encoder.encode(token), encoder.encode(expected))) {
    return null;
  }
  return payload;
}

export async function createAdminSessionCookie(c: Context<{ Bindings: Env }>) {
  const secret = c.env.ADMIN_SESSION_SECRET || 'dev-fallback-secret-change-me';
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `admin:${expiresAt}`;
  const signed = await signValue(payload, secret);
  const isHttps = new URL(c.req.url).protocol === 'https:';

  setCookie(c, ADMIN_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAdminSessionCookie(c: Context<{ Bindings: Env }>) {
  const isHttps = new URL(c.req.url).protocol === 'https:';
  deleteCookie(c, ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Strict',
    path: '/',
  });
}

export async function isValidAdminSession(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const token = getCookie(c, ADMIN_COOKIE_NAME);
  if (!token) return false;
  const secret = c.env.ADMIN_SESSION_SECRET || 'dev-fallback-secret-change-me';
  const payload = await verifySignedValue(token, secret);
  if (!payload || !payload.startsWith('admin:')) return false;
  const exp = Number(payload.split(':')[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

/**
 * Stage 1 Admin Auth Middleware.
 * In Stage 2, swap this single middleware to verify Clerk JWT + role === 'ADMIN'.
 */
export async function adminAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const valid = await isValidAdminSession(c);
  if (!valid) {
    return c.json({ success: false, message: 'Admin authentication required.' }, 401);
  }
  await next();
}
