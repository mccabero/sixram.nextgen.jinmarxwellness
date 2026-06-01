export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

export interface Appointment {
  id: number;
  customerName: string;
  phoneNumber?: string | null;
  serviceOfferingId: number;
  serviceName: string;
  servicePrice?: number | null;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  lastModifiedAt?: string | null;
}

export interface SaveAppointmentRequest {
  customerName: string;
  phoneNumber?: string | null;
  serviceOfferingId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string | null;
}
