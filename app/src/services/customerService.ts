import { apiClient } from "@/lib/api";
import type { Customer, SaveCustomerRequest } from "@/types/customer";

function normalizeCustomer(customer: Customer): Customer {
  return {
    id: customer.id,
    name: customer.name ?? "",
    phoneNumber: customer.phoneNumber ?? "",
    email: customer.email ?? null,
    notes: customer.notes ?? null,
    visitCount: customer.visitCount ?? 0,
    lastVisitAt: customer.lastVisitAt ?? null,
    isActive: Boolean(customer.isActive),
    createdAt: customer.createdAt,
    lastModifiedAt: customer.lastModifiedAt ?? null,
  };
}

function normalizeList(customers: Customer[]) {
  return customers.map(normalizeCustomer);
}

export const customerService = {
  async getAll(activeOnly = false) {
    const query = activeOnly ? "?activeOnly=true" : "";
    const customers = await apiClient.get<Customer[]>(`/api/customers${query}`);

    return normalizeList(customers);
  },
  async getById(id: number | string) {
    const customer = await apiClient.get<Customer>(`/api/customers/${id}`);

    return normalizeCustomer(customer);
  },
  async create(payload: SaveCustomerRequest) {
    const customer = await apiClient.post<Customer>("/api/customers", payload);

    return normalizeCustomer(customer);
  },
  async update(id: number, payload: SaveCustomerRequest) {
    const customer = await apiClient.put<Customer>(
      `/api/customers/${id}`,
      payload,
    );

    return normalizeCustomer(customer);
  },
  async delete(id: number) {
    await apiClient.delete<object>(`/api/customers/${id}`);
  },
};
