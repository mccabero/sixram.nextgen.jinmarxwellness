import { apiClient } from "@/lib/api";
import type {
  SaveServiceOfferingRequest,
  ServiceOffering,
} from "@/types/serviceOffering";

function normalizeServiceOffering(serviceOffering: ServiceOffering): ServiceOffering {
  return {
    id: serviceOffering.id,
    name: serviceOffering.name ?? "",
    serviceCategoryId: serviceOffering.serviceCategoryId ?? 0,
    category: serviceOffering.category ?? "",
    description: serviceOffering.description ?? null,
    durationMinutes: serviceOffering.durationMinutes ?? null,
    price: serviceOffering.price ?? null,
    addOnDetails: serviceOffering.addOnDetails ?? null,
    addOnRate: serviceOffering.addOnRate ?? null,
    isHomeService: Boolean(serviceOffering.isHomeService),
    isActive: Boolean(serviceOffering.isActive),
    createdAt: serviceOffering.createdAt,
    lastModifiedAt: serviceOffering.lastModifiedAt ?? null,
  };
}

function normalizeList(serviceOfferings: ServiceOffering[]) {
  return serviceOfferings.map(normalizeServiceOffering);
}

export const serviceOfferingService = {
  async getAll(activeOnly = false) {
    const query = activeOnly ? "?activeOnly=true" : "";
    const serviceOfferings = await apiClient.get<ServiceOffering[]>(
      `/api/service-offerings${query}`,
    );

    return normalizeList(serviceOfferings);
  },
  async getById(id: number | string) {
    const serviceOffering = await apiClient.get<ServiceOffering>(
      `/api/service-offerings/${id}`,
    );

    return normalizeServiceOffering(serviceOffering);
  },
  async create(payload: SaveServiceOfferingRequest) {
    const serviceOffering = await apiClient.post<ServiceOffering>(
      "/api/service-offerings",
      payload,
    );

    return normalizeServiceOffering(serviceOffering);
  },
  async update(id: number, payload: SaveServiceOfferingRequest) {
    const serviceOffering = await apiClient.put<ServiceOffering>(
      `/api/service-offerings/${id}`,
      payload,
    );

    return normalizeServiceOffering(serviceOffering);
  },
  async delete(id: number) {
    await apiClient.delete<object>(`/api/service-offerings/${id}`);
  },
};
