export interface ServiceOffering {
  id: number;
  name: string;
  serviceCategoryId: number;
  category: string;
  description?: string | null;
  durationMinutes?: number | null;
  price?: number | null;
  addOnDetails?: string | null;
  addOnRate?: number | null;
  isHomeService: boolean;
  isActive: boolean;
  createdAt: string;
  lastModifiedAt?: string | null;
}

export interface SaveServiceOfferingRequest {
  name: string;
  serviceCategoryId: number;
  category?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  price?: number | null;
  addOnDetails?: string | null;
  addOnRate?: number | null;
  isHomeService: boolean;
  isActive: boolean;
}
