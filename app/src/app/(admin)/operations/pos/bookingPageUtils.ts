import { z } from "zod";
import type { Appointment } from "@/types/appointment";
import type {
  Booking,
  BookingSource,
  BookingStatus,
  SaveBookingRequest,
} from "@/types/booking";

export const bookingSources = ["WalkIn", "Appointment"] as const;
export const bookingStatuses = ["Open", "Completed", "Cancelled"] as const;

export const emptyBookingFormValues = {
  source: "WalkIn" as BookingSource,
  appointmentId: 0,
  customerName: "",
  phoneNumber: "",
  serviceOfferingId: 0,
  bookingDate: getTodayDateInputValue(),
  bookingTime: getCurrentTimeInputValue(),
  status: "Open" as BookingStatus,
  notes: "",
};

export const bookingSchema = z
  .object({
    source: z.enum(bookingSources),
    appointmentId: z.number().int().min(0),
    customerName: z.string().max(150).optional(),
    phoneNumber: z.string().max(50).optional(),
    serviceOfferingId: z.number().int().min(0),
    bookingDate: z.string().min(1, "Booking date is required."),
    bookingTime: z.string().min(1, "Booking time is required."),
    status: z.enum(bookingStatuses),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((values, context) => {
    if (values.source === "Appointment" && values.appointmentId <= 0) {
      context.addIssue({
        code: "custom",
        path: ["appointmentId"],
        message: "Appointment is required.",
      });
    }

    if (values.source === "WalkIn" && values.serviceOfferingId <= 0) {
      context.addIssue({
        code: "custom",
        path: ["serviceOfferingId"],
        message: "Service is required.",
      });
    }
  });

export type BookingFormValues = z.infer<typeof bookingSchema>;
export type SourceFilter = "all" | BookingSource;
export type StatusFilter = "all" | BookingStatus;

export function numberOrZero(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortBookings(items: Booking[]) {
  return [...items].sort((first, second) => {
    return (
      new Date(second.bookedAt).getTime() - new Date(first.bookedAt).getTime()
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

export function getCurrentTimeInputValue() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

export function formatBookingDate(value?: string | null) {
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

export function formatBookingTime(value?: string | null) {
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

export function formatBookingDateTime(value?: string | null) {
  const date = formatBookingDate(value);
  const time = formatBookingTime(value);

  return time ? `${date} at ${time}` : date;
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
    return getCurrentTimeInputValue();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getCurrentTimeInputValue();
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function toFormValues(booking: Booking): BookingFormValues {
  return {
    source: booking.source,
    appointmentId: booking.appointmentId ?? 0,
    customerName: booking.customerName ?? "",
    phoneNumber: booking.phoneNumber ?? "",
    serviceOfferingId: booking.serviceOfferingId,
    bookingDate: toDateInputValue(booking.bookedAt),
    bookingTime: toTimeInputValue(booking.bookedAt),
    status: booking.status,
    notes: booking.notes ?? "",
  };
}

export function createFormValuesFromAppointment(
  appointment: Appointment,
): BookingFormValues {
  return {
    ...emptyBookingFormValues,
    source: "Appointment",
    appointmentId: appointment.id,
    customerName: appointment.customerName,
    phoneNumber: appointment.phoneNumber ?? "",
    serviceOfferingId: appointment.serviceOfferingId,
    bookingDate: toDateInputValue(appointment.scheduledAt),
    bookingTime: toTimeInputValue(appointment.scheduledAt),
  };
}

export function toRequest(values: BookingFormValues): SaveBookingRequest {
  const isAppointment = values.source === "Appointment";

  return {
    source: values.source,
    appointmentId: isAppointment ? values.appointmentId : null,
    customerName: isAppointment ? null : values.customerName?.trim() || null,
    phoneNumber: isAppointment ? null : values.phoneNumber?.trim() || null,
    serviceOfferingId: isAppointment ? 0 : values.serviceOfferingId,
    bookedAt: `${values.bookingDate}T${values.bookingTime}:00+08:00`,
    status: values.status,
    notes: values.notes?.trim() || null,
  };
}
