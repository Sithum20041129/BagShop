import { AppError } from '../middlewares/error';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class MediaService {
  constructor(private bucket: R2Bucket, private publicUrlBase = '/api/media') {}

  async uploadImage(file: File): Promise<{ key: string; url: string }> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError('Only JPEG, PNG, and WebP images are allowed', 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('Image must be 5MB or smaller', 400);
    }

    const ext =
      file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const key = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const buffer = await file.arrayBuffer();
    await this.bucket.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const cleanBase = this.publicUrlBase.replace(/\/+$/, '');
    return {
      key,
      url: `${cleanBase}/${key}`,
    };
  }

  async getImage(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  async deleteImage(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
