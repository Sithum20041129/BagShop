export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  ADMIN_PASSCODE: string;
  ADMIN_SESSION_SECRET: string;
  R2_PUBLIC_URL?: string;
}
