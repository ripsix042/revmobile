const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  data?: T;
} & T;

// --- Product types & API (API-first CRUD) ---
export type ApiProduct = {
  id: number | string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockLevel?: number;
  createdAt?: string;
};

export type ApiProductCreate = {
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
};

// --- Invoice types & API (API-first CRUD) ---
export type ApiInvoiceItem = {
  id?: number | string;
  productId: number | string;
  quantity: number;
  price: number;
  productName?: string;
};

export type ApiInvoice = {
  id: number | string;
  invoiceNumber?: string;
  totalAmount: number;
  totalItems?: number;
  createdAt: string;
  items?: ApiInvoiceItem[];
};

export type ApiInvoiceCreate = {
  totalAmount: number;
  totalItems: number;
  items: { productId: number | string; quantity: number; price: number }[];
};

function normalizeId(id: number | string | undefined): number | string {
  if (id === undefined) return 0;
  return id;
}

function normalizeProduct(raw: any): ApiProduct {
  const id = raw?.id ?? raw?._id ?? 0;
  return {
    id: normalizeId(id),
    name: String(raw?.name ?? ''),
    costPrice: Number(raw?.costPrice ?? 0),
    sellingPrice: Number(raw?.sellingPrice ?? 0),
    quantity: Number(raw?.quantity ?? 0),
    lowStockLevel: raw?.lowStockLevel != null ? Number(raw.lowStockLevel) : undefined,
    createdAt: raw?.createdAt,
  };
}

function normalizeInvoice(raw: any): ApiInvoice {
  const id = raw?.id ?? raw?._id ?? 0;
  const items = Array.isArray(raw?.items)
    ? raw.items.map((i: any) => ({
        id: i?.id ?? i?._id,
        productId: normalizeId(i?.productId ?? i?.product?._id ?? i?.product?.id ?? 0),
        quantity: Number(i?.quantity ?? 0),
        price: Number(i?.price ?? 0),
        productName: i?.productName ?? i?.product?.name,
      }))
    : undefined;
  return {
    id: normalizeId(id),
    invoiceNumber: raw?.invoiceNumber,
    totalAmount: Number(raw?.totalAmount ?? 0),
    totalItems: raw?.totalItems != null ? Number(raw.totalItems) : undefined,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    items,
  };
}

export const productsApi = {
  async list(): Promise<ApiProduct[]> {
    const res = await api.get<any>('/products');
    const list = Array.isArray(res) ? res : res?.data ?? res?.products ?? [];
    return list.map(normalizeProduct);
  },

  async getOne(id: number | string): Promise<ApiProduct | null> {
    try {
      const res = await api.get<any>(`/products/${id}`);
      const raw = res?.data ?? res?.product ?? res;
      return raw ? normalizeProduct(raw) : null;
    } catch {
      return null;
    }
  },

  async create(payload: ApiProductCreate): Promise<ApiProduct> {
    const res = await api.post<any>('/products', payload);
    const raw = res?.data ?? res?.product ?? res;
    return normalizeProduct(raw ?? payload);
  },

  async update(id: number | string, payload: Partial<ApiProductCreate> & { name?: string; costPrice?: number; sellingPrice?: number; quantity?: number }): Promise<ApiProduct> {
    const res = await api.put<any>(`/products/${id}`, payload);
    const raw = res?.data ?? res?.product ?? res;
    return normalizeProduct(raw ?? { ...payload, id });
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};

export const invoicesApi = {
  async list(): Promise<ApiInvoice[]> {
    const res = await api.get<any>('/invoices');
    const list = Array.isArray(res) ? res : res?.data ?? res?.invoices ?? [];
    return list.map(normalizeInvoice);
  },

  async getOne(id: number | string): Promise<ApiInvoice | null> {
    try {
      const res = await api.get<any>(`/invoices/${id}`);
      const raw = res?.data ?? res?.invoice ?? res;
      return raw ? normalizeInvoice(raw) : null;
    } catch {
      return null;
    }
  },

  async create(payload: ApiInvoiceCreate): Promise<ApiInvoice> {
    const res = await api.post<any>('/invoices', payload);
    const raw = res?.data ?? res?.invoice ?? res;
    return normalizeInvoice(raw ?? { ...payload, id: 0, createdAt: new Date().toISOString() });
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};

export type ApiMonthlyReport = {
  totalSales: number;
  totalProfit: number;
  totalInvoices: number;
};

export type ApiDashboardStats = {
  todaySales: number;
  monthlySales: number;
  lowStockCount: number;
};

export const dashboardApi = {
  async getStats(): Promise<ApiDashboardStats> {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tzOffset = now.getTimezoneOffset();
    const res = await api.get<any>(`/dashboard?date=${encodeURIComponent(date)}&tzOffset=${tzOffset}`);
    const raw = res?.data ?? res;
    return {
      todaySales: Number(raw?.todaySales ?? 0),
      monthlySales: Number(raw?.monthlySales ?? 0),
      lowStockCount: Number(raw?.lowStockCount ?? 0),
    };
  },
};

export const reportsApi = {
  async getMonthly(month: number, year: number): Promise<ApiMonthlyReport> {
    const tzOffset = new Date().getTimezoneOffset();
    const res = await api.get<any>(
      `/reports/monthly?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}&tzOffset=${tzOffset}`
    );
    const raw = res?.data ?? res;
    return {
      totalSales: Number(raw?.totalSales ?? 0),
      totalProfit: Number(raw?.totalProfit ?? 0),
      totalInvoices: Number(raw?.totalInvoices ?? 0),
    };
  },
};

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  },

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  },

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  },

  // Health check
  async checkConnection(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  },
};
