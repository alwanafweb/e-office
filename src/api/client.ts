import { Customer, SPH, PKS, Invoice } from '../types';

/**
 * Returns the configured Cloudflare Worker API URL
 */
export const getWorkerUrl = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const proc = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

  const configured = (
    metaEnv.VITE_CLOUDFLARE_WORKER_URL ||
    proc.VITE_CLOUDFLARE_WORKER_URL ||
    ''
  ).trim();

  if (configured && configured.startsWith('http')) {
    return configured.replace(/\/$/, '');
  }

  // Use local relative API path by default
  return '';
};

/**
 * Checks if Cloudflare Worker or Local API URL is configured
 */
export const isWorkerConfigured = (): boolean => {
  return true;
};

/**
 * Generic API request wrapper for Cloudflare Worker or Local Express backend
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getWorkerUrl();

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
        try {
          const errorData = JSON.parse(rawText);
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Fallback to default message
        }
      }
      throw new Error(errorMessage);
    }

    const trimmedText = rawText.trim();
    if (contentType.includes('application/json') || trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      try {
        return JSON.parse(trimmedText) as T;
      } catch (err) {
        throw new Error(`Invalid JSON response received from API: ${(err as Error).message}`);
      }
    }

    throw new Error(`Expected JSON from API, but received non-JSON payload (${contentType || 'text/html'})`);
  } catch (err) {
    console.warn(`API Fetch notice [${endpoint}]:`, (err as Error).message);
    throw err;
  }
}

// ==========================================
// HEALTH CHECK API
// ==========================================
export const apiCheckHealth = async (): Promise<{ status: string; database: string; timestamp: string }> => {
  return apiFetch<{ status: string; database: string; timestamp: string }>('/api/health');
};

// ==========================================
// CUSTOMER CRUD API
// ==========================================
export const apiGetCustomers = async (): Promise<Customer[]> => {
  return apiFetch<Customer[]>('/api/customers');
};

export const apiGetCustomerById = async (id: string): Promise<Customer> => {
  return apiFetch<Customer>(`/api/customers/${id}`);
};

export const apiCreateCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }): Promise<Customer> => {
  return apiFetch<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
};

export const apiUpdateCustomer = async (id: string, customer: Partial<Customer>): Promise<Customer> => {
  return apiFetch<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });
};

export const apiDeleteCustomer = async (id: string): Promise<{ success: boolean; id: string }> => {
  return apiFetch<{ success: boolean; id: string }>(`/api/customers/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// SPH (Penawaran Harga) CRUD API
// ==========================================
export const apiGetSPHs = async (): Promise<SPH[]> => {
  return apiFetch<SPH[]>('/api/sph');
};

export const apiGetSPHById = async (id: string): Promise<SPH> => {
  return apiFetch<SPH>(`/api/sph/${id}`);
};

export const apiCreateSPH = async (sph: SPH): Promise<SPH> => {
  return apiFetch<SPH>('/api/sph', {
    method: 'POST',
    body: JSON.stringify(sph),
  });
};

export const apiUpdateSPH = async (id: string, sph: Partial<SPH>): Promise<SPH> => {
  return apiFetch<SPH>(`/api/sph/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sph),
  });
};

export const apiDeleteSPH = async (id: string): Promise<{ success: boolean; id: string }> => {
  return apiFetch<{ success: boolean; id: string }>(`/api/sph/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// PKS (Kontrak Kerjasama) CRUD API
// ==========================================
export const apiGetPKSs = async (): Promise<PKS[]> => {
  return apiFetch<PKS[]>('/api/pks');
};

export const apiGetPKSById = async (id: string): Promise<PKS> => {
  return apiFetch<PKS>(`/api/pks/${id}`);
};

export const apiCreatePKS = async (pks: PKS): Promise<PKS> => {
  return apiFetch<PKS>('/api/pks', {
    method: 'POST',
    body: JSON.stringify(pks),
  });
};

export const apiUpdatePKS = async (id: string, pks: Partial<PKS>): Promise<PKS> => {
  return apiFetch<PKS>(`/api/pks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pks),
  });
};

export const apiDeletePKS = async (id: string): Promise<{ success: boolean; id: string }> => {
  return apiFetch<{ success: boolean; id: string }>(`/api/pks/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// INVOICE CRUD API
// ==========================================
export const apiGetInvoices = async (): Promise<Invoice[]> => {
  return apiFetch<Invoice[]>('/api/invoices');
};

export const apiGetInvoiceById = async (id: string): Promise<Invoice> => {
  return apiFetch<Invoice>(`/api/invoices/${id}`);
};

export const apiCreateInvoice = async (invoice: Invoice): Promise<Invoice> => {
  return apiFetch<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice),
  });
};

export const apiUpdateInvoice = async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
  return apiFetch<Invoice>(`/api/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(invoice),
  });
};

export const apiDeleteInvoice = async (id: string): Promise<{ success: boolean; id: string }> => {
  return apiFetch<{ success: boolean; id: string }>(`/api/invoices/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// BATCH / BULK SYNC API
// ==========================================
export interface SyncDataPayload {
  customers?: Customer[];
  sphs?: SPH[];
  pkss?: PKS[];
  invoices?: Invoice[];
}

export const apiSyncAllData = async (data: SyncDataPayload): Promise<{ success: boolean; count: number }> => {
  return apiFetch<{ success: boolean; count: number }>('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
