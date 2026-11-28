import type {
  CreateProductInput,
  ProductDTO,
  UpdateProductInput,
} from '@shared/schemas/product.schema';
import type {
  CreateOrderInput,
  OrderDTO,
  OrderStatus,
} from '@shared/schemas/order.schema';
import type {
  StoreSettingsDTO,
  UpdateStoreSettingsInput,
} from '@shared/schemas/store.schema';

export interface AuthUserDTO {
  id: number;
  clerkId: string | null;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

let authTokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  authTokenGetter = getter;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = authTokenGetter ? await authTokenGetter() : null;

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
  } & T;

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // Auth
  getAuthMe: () => request<{ user: AuthUserDTO }>('/api/auth/me'),

  // Storefront
  getStoreStatus: () => request<{ settings: StoreSettingsDTO }>('/api/store/status'),

  subscribeNewsletter: (email: string) =>
    request<{ message: string; alreadySubscribed: boolean }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getProducts: (params?: {
    category?: string;
    search?: string;
    sort?: string;
    inStock?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.inStock) query.set('inStock', 'true');
    const qs = query.toString();
    return request<{ products: ProductDTO[] }>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  getProductBySlug: (slug: string) =>
    request<{ product: ProductDTO }>(`/api/products/${encodeURIComponent(slug)}`),

  createOrder: (input: CreateOrderInput) =>
    request<{ order: OrderDTO }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  trackOrder: (orderNumber: string, phone: string) =>
    request<{ order: OrderDTO }>(
      `/api/orders/track/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone)}`
    ),

  // Admin Products (Clerk ADMIN role protected)
  adminGetProducts: () => request<{ products: ProductDTO[] }>('/api/admin/products'),

  adminCreateProduct: (input: CreateProductInput) =>
    request<{ product: ProductDTO }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  adminUpdateProduct: (id: number, input: UpdateProductInput) =>
    request<{ product: ProductDTO }>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  adminDeleteProduct: (id: number) =>
    request<{ message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),

  // Admin R2 Upload
  adminUploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ key: string; url: string }>('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Admin Orders
  adminGetOrders: (params?: { status?: string; preorder?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.preorder !== undefined) query.set('preorder', String(params.preorder));
    const qs = query.toString();
    return request<{ orders: OrderDTO[] }>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
  },

  adminUpdateOrderStatus: (id: number, status: OrderStatus, trackingCode?: string | null) =>
    request<{ order: OrderDTO }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingCode }),
    }),

  // Admin Store Settings (Open / Closed Pre-Order Toggle)
  adminUpdateStoreStatus: (input: UpdateStoreSettingsInput) =>
    request<{ settings: StoreSettingsDTO }>('/api/admin/store-status', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  // Admin WhatsApp Cloud API Status & Test
  adminGetWhatsAppStatus: () =>
    request<{ configured: boolean }>('/api/admin/whatsapp-status'),

  adminTestWhatsApp: () =>
    request<{ sent: boolean; mode: 'live' | 'preview'; detail?: string }>(
      '/api/admin/whatsapp-test',
      { method: 'POST' }
    ),
};
