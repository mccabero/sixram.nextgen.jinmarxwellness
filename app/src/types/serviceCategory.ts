export interface ServiceCategory {
  id: number;
  name: string;
  description?: string | null;
  serviceCount: number;
  createdAt: string;
  lastModifiedAt?: string | null;
}

export interface SaveServiceCategoryRequest {
  name: string;
  description?: string | null;
}
