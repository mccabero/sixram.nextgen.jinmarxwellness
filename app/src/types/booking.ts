export type BookingSource = "WalkIn" | "Appointment";
export type BookingStatus = "Open" | "Completed" | "Cancelled";

export interface Booking {
  id: number;
  source: BookingSource;
  appointmentId?: number | null;
  customerName?: string | null;
  phoneNumber?: string | null;
  serviceOfferingId: number;
  serviceName: string;
  servicePrice?: number | null;
  bookedAt: string;
  status: BookingStatus;
  notes?: string | null;
  createdAt: string;
  lastModifiedAt?: string | null;
}

export interface SaveBookingRequest {
  source: BookingSource;
  appointmentId?: number | null;
  customerName?: string | null;
  phoneNumber?: string | null;
  serviceOfferingId: number;
  bookedAt: string;
  status: BookingStatus;
  notes?: string | null;
}
