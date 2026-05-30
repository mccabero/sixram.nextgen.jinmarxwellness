import { apiClient } from "@/lib/api";
import type {
  SaveServiceCategoryRequest,
  ServiceCategory,
} from "@/types/serviceCategory";

function normalizeServiceCategory(
  serviceCategory: ServiceCategory,
): ServiceCategory {
  return {
    id: serviceCategory.id,
    name: serviceCategory.name ?? "",
    description: serviceCategory.description ?? null,
    serviceCount: serviceCategory.serviceCount ?? 0,
    createdAt: serviceCategory.createdAt,
    lastModifiedAt: serviceCategory.lastModifiedAt ?? null,
  };
}

function normalizeList(serviceCategories: ServiceCategory[]) {
  return serviceCategories.map(normalizeServiceCategory);
}

export const serviceCategoryService = {
  async getAll() {
    const serviceCategories = await apiClient.get<ServiceCategory[]>(
      "/api/service-categories",
    );

    return normalizeList(serviceCategories);
  },
  async getById(id: number | string) {
    const serviceCategory = await apiClient.get<ServiceCategory>(
      `/api/service-categories/${id}`,
    );

    return normalizeServiceCategory(serviceCategory);
  },
  async create(payload: SaveServiceCategoryRequest) {
    const serviceCategory = await apiClient.post<ServiceCategory>(
      "/api/service-categories",
      payload,
    );

    return normalizeServiceCategory(serviceCategory);
  },
  async update(id: number, payload: SaveServiceCategoryRequest) {
    const serviceCategory = await apiClient.put<ServiceCategory>(
      `/api/service-categories/${id}`,
      payload,
    );

    return normalizeServiceCategory(serviceCategory);
  },
  async delete(id: number) {
    await apiClient.delete<object>(`/api/service-categories/${id}`);
  },
};
