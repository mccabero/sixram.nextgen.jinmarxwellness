import { apiClient } from "@/lib/api";
import type {
  Booking,
  BookingSource,
  BookingStatus,
  SaveBookingRequest,
} from "@/types/booking";

type BookingQuery = {
  from?: string;
  to?: string;
};

const fallbackSource: BookingSource = "WalkIn";
const fallbackStatus: BookingStatus = "Open";

function normalizeSource(source?: string | null): BookingSource {
  return source === "Appointment" ? source : fallbackSource;
}

function normalizeStatus(status?: string | null): BookingStatus {
  return status === "Completed" || status === "Cancelled"
    ? status
    : fallbackStatus;
}

function normalizeBooking(booking: Booking): Booking {
  return {
    id: booking.id,
    source: normalizeSource(booking.source),
    appointmentId: booking.appointmentId ?? null,
    customerName: booking.customerName ?? null,
    phoneNumber: booking.phoneNumber ?? null,
    serviceOfferingId: booking.serviceOfferingId ?? 0,
    serviceName: booking.serviceName ?? "",
    servicePrice: booking.servicePrice ?? null,
    bookedAt: booking.bookedAt,
    status: normalizeStatus(booking.status),
    notes: booking.notes ?? null,
    createdAt: booking.createdAt,
    lastModifiedAt: booking.lastModifiedAt ?? null,
  };
}

function normalizeList(bookings: Booking[]) {
  return bookings.map(normalizeBooking);
}

function buildQuery(query?: BookingQuery) {
  const params = new URLSearchParams();

  if (query?.from) {
    params.set("from", query.from);
  }

  if (query?.to) {
    params.set("to", query.to);
  }

  const value = params.toString();
  return value ? `?${value}` : "";
}

export const bookingService = {
  async getAll(query?: BookingQuery) {
    const bookings = await apiClient.get<Booking[]>(
      `/api/bookings${buildQuery(query)}`,
    );

    return normalizeList(bookings);
  },
  async getById(id: number | string) {
    const booking = await apiClient.get<Booking>(`/api/bookings/${id}`);

    return normalizeBooking(booking);
  },
  async create(payload: SaveBookingRequest) {
    const booking = await apiClient.post<Booking>("/api/bookings", payload);

    return normalizeBooking(booking);
  },
  async update(id: number, payload: SaveBookingRequest) {
    const booking = await apiClient.put<Booking>(
      `/api/bookings/${id}`,
      payload,
    );

    return normalizeBooking(booking);
  },
  async delete(id: number) {
    await apiClient.delete<object>(`/api/bookings/${id}`);
  },
};
