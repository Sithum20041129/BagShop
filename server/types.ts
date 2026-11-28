export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY: string;
  R2_PUBLIC_URL?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  ADMIN_WHATSAPP_NUMBER?: string;
  WHATSAPP_API_VERSION?: string;
}
