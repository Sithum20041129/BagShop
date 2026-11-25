import { eq } from 'drizzle-orm';
import type { AppDb } from '../db';
import { storeSettings, subscribers } from '../db/schema';
import type { StoreSettingsDTO, UpdateStoreSettingsInput } from '@shared/schemas/store.schema';

export class StoreRepository {
  constructor(private db: AppDb) {}

  async getSettings(): Promise<StoreSettingsDTO> {
    const rows = await this.db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, 1))
      .limit(1);

    if (rows[0]) {
      return {
        id: rows[0].id,
        isOpen: rows[0].isOpen,
        closedMessage: rows[0].closedMessage,
        businessHours: rows[0].businessHours,
        shippingFeeLkr: rows[0].shippingFeeLkr,
        updatedAt: rows[0].updatedAt,
      };
    }

    // Auto-create singleton row if DB is empty
    const now = new Date().toISOString();
    const inserted = await this.db
      .insert(storeSettings)
      .values({
        id: 1,
        isOpen: true,
        closedMessage:
          'We are currently closed. Pre-orders are open and will be dispatched when we reopen.',
        businessHours: 'Mon – Sat, 9:00 AM – 6:00 PM',
        shippingFeeLkr: 650,
        updatedAt: now,
      })
      .returning();

    return {
      id: inserted[0].id,
      isOpen: inserted[0].isOpen,
      closedMessage: inserted[0].closedMessage,
      businessHours: inserted[0].businessHours,
      shippingFeeLkr: inserted[0].shippingFeeLkr,
      updatedAt: inserted[0].updatedAt,
    };
  }

  async updateSettings(input: UpdateStoreSettingsInput): Promise<StoreSettingsDTO> {
    await this.getSettings(); // Ensure row 1 exists
    const now = new Date().toISOString();
    const rows = await this.db
      .update(storeSettings)
      .set({
        isOpen: input.isOpen,
        closedMessage: input.closedMessage,
        businessHours: input.businessHours,
        shippingFeeLkr: input.shippingFeeLkr,
        updatedAt: now,
      })
      .where(eq(storeSettings.id, 1))
      .returning();

    return {
      id: rows[0].id,
      isOpen: rows[0].isOpen,
      closedMessage: rows[0].closedMessage,
      businessHours: rows[0].businessHours,
      shippingFeeLkr: rows[0].shippingFeeLkr,
      updatedAt: rows[0].updatedAt,
    };
  }

  async addSubscriber(email: string): Promise<{ alreadySubscribed: boolean }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, normalized))
      .limit(1);

    if (existing.length > 0) {
      return { alreadySubscribed: true };
    }

    await this.db.insert(subscribers).values({
      email: normalized,
      createdAt: new Date().toISOString(),
    });

    return { alreadySubscribed: false };
  }
}
