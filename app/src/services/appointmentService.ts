import { apiClient } from "@/lib/api";
import type {
  Appointment,
  AppointmentStatus,
  SaveAppointmentRequest,
} from "@/types/appointment";

type AppointmentQuery = {
  from?: string;
  to?: string;
};

const fallbackStatus: AppointmentStatus = "Scheduled";

function normalizeStatus(status?: string | null): AppointmentStatus {
  return status === "Completed" || status === "Cancelled"
    ? status
    : fallbackStatus;
}

function normalizeAppointment(appointment: Appointment): Appointment {
  return {
    id: appointment.id,
    customerName: appointment.customerName ?? "",
    phoneNumber: appointment.phoneNumber ?? null,
    serviceOfferingId: appointment.serviceOfferingId ?? 0,
    serviceName: appointment.serviceName ?? "",
    servicePrice: appointment.servicePrice ?? null,
    scheduledAt: appointment.scheduledAt,
    status: normalizeStatus(appointment.status),
    notes: appointment.notes ?? null,
    createdAt: appointment.createdAt,
    lastModifiedAt: appointment.lastModifiedAt ?? null,
  };
}

function normalizeList(appointments: Appointment[]) {
  return appointments.map(normalizeAppointment);
}

function buildQuery(query?: AppointmentQuery) {
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

export const appointmentService = {
  async getAll(query?: AppointmentQuery) {
    const appointments = await apiClient.get<Appointment[]>(
      `/api/appointments${buildQuery(query)}`,
    );

    return normalizeList(appointments);
  },
  async getById(id: number | string) {
    const appointment = await apiClient.get<Appointment>(
      `/api/appointments/${id}`,
    );

    return normalizeAppointment(appointment);
  },
  async create(payload: SaveAppointmentRequest) {
    const appointment = await apiClient.post<Appointment>(
      "/api/appointments",
      payload,
    );

    return normalizeAppointment(appointment);
  },
  async update(id: number, payload: SaveAppointmentRequest) {
    const appointment = await apiClient.put<Appointment>(
      `/api/appointments/${id}`,
      payload,
    );

    return normalizeAppointment(appointment);
  },
  async delete(id: number) {
    await apiClient.delete<object>(`/api/appointments/${id}`);
  },
};
