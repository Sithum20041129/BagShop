import { z } from 'zod';

export const UpdateStoreSettingsSchema = z.object({
  isOpen: z.boolean(),
  closedMessage: z.string().trim().min(5, 'Closed notice message is required'),
  businessHours: z.string().trim().min(2, 'Business hours are required'),
  shippingFeeLkr: z.coerce.number().int().min(0, 'Shipping fee cannot be negative'),
});

export const NewsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export const AdminLoginSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required'),
});

export type UpdateStoreSettingsInput = z.infer<typeof UpdateStoreSettingsSchema>;
export type NewsletterInput = z.infer<typeof NewsletterSchema>;
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export interface StoreSettingsDTO {
  id: number;
  isOpen: boolean;
  closedMessage: string;
  businessHours: string;
  shippingFeeLkr: number;
  updatedAt: string;
}
