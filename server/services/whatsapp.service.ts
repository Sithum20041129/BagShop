import type { Env } from '../types';
import type { OrderDTO } from '@shared/schemas/order.schema';

function formatLkr(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-LK')}`;
}

export function formatOrderWhatsAppMessage(order: OrderDTO): string {
  const header = order.isPreorder
    ? '🛍️ *NEW PRE-ORDER RECEIVED — BRIGHT BUY*'
    : '🛍️ *NEW ORDER RECEIVED — BRIGHT BUY*';

  const itemLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productNameSnapshot} × ${item.quantity} — ${formatLkr(
          item.unitPriceLkr * item.quantity
        )}`
    )
    .join('\n');

  const lines = [
    header,
    `Reference: *${order.orderNumber}*`,
    '',
    '*Customer Details*',
    `• Name: ${order.customerName}`,
    `• Phone: ${order.customerPhone}`,
    ...(order.customerEmail ? [`• Email: ${order.customerEmail}`] : []),
    `• Address: ${order.shippingAddress}`,
    `• City: ${order.city}`,
    ...(order.notes ? [`• Delivery Notes: ${order.notes}`] : []),
    '',
    '*Ordered Items*',
    itemLines,
    '',
    `Subtotal: ${formatLkr(order.subtotalLkr)}`,
    `Shipping: ${order.shippingLkr === 0 ? 'Complimentary' : formatLkr(order.shippingLkr)}`,
    `*Total (COD): ${formatLkr(order.totalLkr)}*`,
  ];

  return lines.join('\n');
}

export class WhatsAppService {
  constructor(private env: Env) {}

  isConfigured(): boolean {
    return Boolean(
      this.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
        this.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
        this.env.ADMIN_WHATSAPP_NUMBER?.trim()
    );
  }

  async sendTextMessage(
    bodyText: string
  ): Promise<{ sent: boolean; mode: 'live' | 'preview'; detail?: string }> {
    if (!this.isConfigured()) {
      console.log('\n[WhatsApp Preview - Credentials not set in .dev.vars]\n' + bodyText + '\n');
      return {
        sent: false,
        mode: 'preview',
        detail:
          'WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, ADMIN_WHATSAPP_NUMBER) are not configured yet. Message logged to server console.',
      };
    }

    const version = this.env.WHATSAPP_API_VERSION || 'v21.0';
    const phoneId = this.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
    const to = this.env.ADMIN_WHATSAPP_NUMBER!.replace(/\D/g, '');
    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.WHATSAPP_ACCESS_TOKEN!.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: bodyText,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[WhatsApp Cloud API Error]', res.status, errText);
        return {
          sent: false,
          mode: 'live',
          detail: `Meta API returned ${res.status}: ${errText}`,
        };
      }

      return { sent: true, mode: 'live' };
    } catch (err) {
      console.error('[WhatsApp Fetch Error]', err);
      return {
        sent: false,
        mode: 'live',
        detail: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  async sendNewOrderAlert(order: OrderDTO) {
    const message = formatOrderWhatsAppMessage(order);
    return this.sendTextMessage(message);
  }
}
