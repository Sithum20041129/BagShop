import type { AppDb } from '../db';
import { StoreRepository } from '../repositories/store.repository';
import type { StoreSettingsDTO, UpdateStoreSettingsInput } from '@shared/schemas/store.schema';

export class StoreService {
  private repo: StoreRepository;

  constructor(db: AppDb) {
    this.repo = new StoreRepository(db);
  }

  async getStatus(): Promise<StoreSettingsDTO> {
    return this.repo.getSettings();
  }

  async updateStatus(input: UpdateStoreSettingsInput): Promise<StoreSettingsDTO> {
    return this.repo.updateSettings(input);
  }

  async subscribeNewsletter(email: string): Promise<{ message: string; alreadySubscribed: boolean }> {
    const result = await this.repo.addSubscriber(email);
    if (result.alreadySubscribed) {
      return {
        message: 'You are already subscribed to Bright Buy updates.',
        alreadySubscribed: true,
      };
    }
    return {
      message: 'Welcome to Bright Buy. You will receive our latest collection releases.',
      alreadySubscribed: false,
    };
  }
}
