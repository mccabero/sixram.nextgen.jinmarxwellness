import { z } from "zod";
import type {
  Appointment,
  AppointmentStatus,
  SaveAppointmentRequest,
} from "@/types/appointment";

export const appointmentStatuses = [
  "Scheduled",
  "Completed",
  "Cancelled",
] as const;

export const defaultAppointmentTime = "09:00";

export const emptyAppointmentFormValues = {
  customerName: "",
  phoneNumber: "",
  serviceOfferingId: 0,
  appointmentDate: getTodayDateInputValue(),
  appointmentTime: defaultAppointmentTime,
  status: "Scheduled" as AppointmentStatus,
  notes: "",
};

export const appointmentSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(150),
  phoneNumber: z.string().max(50).optional(),
  serviceOfferingId: z
    .number()
    .int("Service is required.")
    .positive("Service is required."),
  appointmentDate: z.string().min(1, "Appointment date is required."),
  appointmentTime: z.string().min(1, "Appointment time is required."),
  status: z.enum(appointmentStatuses),
  notes: z.string().max(1000).optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
export type StatusFilter = "all" | AppointmentStatus;

export function numberOrZero(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortAppointments(items: Appointment[]) {
  return [...items].sort((first, second) => {
    return (
      new Date(first.scheduledAt).getTime() -
      new Date(second.scheduledAt).getTime()
    );
  });
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateInputValue(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function formatAppointmentDate(value?: string | null) {
  if (!value) {
    return "Unset";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unset";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatAppointmentTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatAppointmentDateTime(value?: string | null) {
  const date = formatAppointmentDate(value);
  const time = formatAppointmentTime(value);

  return time ? `${date} at ${time}` : date;
}

export function isSameLocalDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return getTodayDateInputValue();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getTodayDateInputValue();
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value?: string | null) {
  if (!value) {
    return defaultAppointmentTime;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return defaultAppointmentTime;
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function toFormValues(
  appointment: Appointment,
): AppointmentFormValues {
  return {
    customerName: appointment.customerName,
    phoneNumber: appointment.phoneNumber ?? "",
    serviceOfferingId: appointment.serviceOfferingId,
    appointmentDate: toDateInputValue(appointment.scheduledAt),
    appointmentTime: toTimeInputValue(appointment.scheduledAt),
    status: appointment.status,
    notes: appointment.notes ?? "",
  };
}

export function createEmptyAppointmentFormValues(initialDate?: string | null) {
  return {
    ...emptyAppointmentFormValues,
    appointmentDate: isDateInputValue(initialDate)
      ? initialDate!
      : getTodayDateInputValue(),
  };
}

export function toRequest(
  values: AppointmentFormValues,
): SaveAppointmentRequest {
  return {
    customerName: values.customerName.trim(),
    phoneNumber: values.phoneNumber?.trim() || null,
    serviceOfferingId: values.serviceOfferingId,
    scheduledAt: `${values.appointmentDate}T${values.appointmentTime}:00+08:00`,
    status: values.status,
    notes: values.notes?.trim() || null,
  };
}
