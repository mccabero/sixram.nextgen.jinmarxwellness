export interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  email?: string | null;
  notes?: string | null;
  visitCount: number;
  lastVisitAt?: string | null;
  isActive: boolean;
  createdAt: string;
  lastModifiedAt?: string | null;
}

export interface SaveCustomerRequest {
  name: string;
  phoneNumber: string;
  email?: string | null;
  notes?: string | null;
  visitCount: number;
  lastVisitAt?: string | null;
  isActive: boolean;
}
