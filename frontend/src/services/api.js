const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  getTaxInvoices: () => request('/tax-invoices'),
  createTaxInvoice: data => request('/tax-invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateTaxInvoice: (id, data) => request(`/tax-invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLedgerParties: () => request('/ledger/parties'),
  updatePurchase: (id, data) => request(`/purchases/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLedger: (customerId, signal) => request(`/ledger/${encodeURIComponent(customerId)}`, { signal }),
  createLedgerReceipt: (customerId, data) => request(`/ledger/${encodeURIComponent(customerId)}/receipts`, { method: 'POST', body: JSON.stringify(data) }),
  getEmployees: (signal) => request('/staff', { signal }),
  saveEmployee: (data, id) => request(id ? '/staff/employees/' + id : '/staff', {
    method: id ? 'PUT' : 'POST', body: JSON.stringify(data)
  }),
  getPayroll: (month, signal) => request('/staff/payroll/' + month, { signal }),
  previewPayroll: (month, adjustments) => request('/staff/payroll/' + month + '/preview', {
    method: 'POST', body: JSON.stringify({ adjustments })
  }),
  savePayroll: (month, adjustments, revision) => request('/staff/payroll/' + month, {
    method: 'POST', body: JSON.stringify({ adjustments, revision })
  }),

  // Purchases
  getInventory: (params = {}, signal) => request(`/inventory?${new URLSearchParams(params)}`, { signal }),
  createInventoryItem: data => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (id, data) => request(`/inventory/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id, revision) => request(`/inventory/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ revision }) }),

  getPurchases: (params = {}) => request(`/purchases?${new URLSearchParams(params)}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = {}, signal) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`, { signal });
  },
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/quotations${query ? `?${query}` : ''}`);
  },
  getQuotationById: (id) => request(`/quotations/${id}`),
  createQuotation: (data) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateQuotation: (id, data) => request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateQuotationStatus: (id, status) =>
    request(`/quotations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },
  getSaleById: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  updateSale: (id, data) => request(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleSaleLock: (id, isLocked) =>
    request(`/sales/${id}/lock`, {
      method: 'PATCH',
      body: JSON.stringify(isLocked !== undefined ? { isLocked } : {})
    })
};
