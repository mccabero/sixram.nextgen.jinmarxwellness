/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  NotebookPen,
  Phone,
  ReceiptText,
  Save,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { appointmentService } from "@/services/appointmentService";
import { bookingService } from "@/services/bookingService";
import { serviceOfferingService } from "@/services/serviceOfferingService";
import type { Appointment } from "@/types/appointment";
import type { Booking, BookingSource } from "@/types/booking";
import type { ServiceOffering } from "@/types/serviceOffering";
import {
  bookingSchema,
  bookingStatuses,
  createFormValuesFromAppointment,
  emptyBookingFormValues,
  formatBookingDateTime,
  numberOrZero,
  toFormValues,
  toRequest,
  type BookingFormValues,
} from "./bookingPageUtils";

type ManageBookingPageClientProps = {
  bookingId?: string;
  initialAppointmentId?: string;
  initialSource?: BookingSource;
};

const bookingListPath = "/operations/pos";

export function ManageBookingPageClient({
  bookingId,
  initialAppointmentId,
  initialSource,
}: ManageBookingPageClientProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeBookingId = bookingId ?? params.id;
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("pos.manage");
  const isEditMode = Boolean(routeBookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceOfferings, setServiceOfferings] = useState<ServiceOffering[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: emptyBookingFormValues,
  });

  const selectedSource = useWatch({ control, name: "source" });
  const selectedAppointmentId = useWatch({ control, name: "appointmentId" });
  const selectedServiceOfferingId = useWatch({
    control,
    name: "serviceOfferingId",
  });

  const availableAppointments = useMemo(() => {
    const currentBookingId = booking?.id;
    const bookedAppointmentIds = new Set(
      bookings
        .filter((item) => item.id !== currentBookingId)
        .map((item) => item.appointmentId)
        .filter((value): value is number => Boolean(value)),
    );

    return appointments.filter((appointment) => {
      if (appointment.id === booking?.appointmentId) {
        return true;
      }

      return (
        appointment.status === "Scheduled" &&
        !bookedAppointmentIds.has(appointment.id)
      );
    });
  }, [appointments, booking?.appointmentId, booking?.id, bookings]);

  const selectedAppointment = appointments.find(
    (appointment) => appointment.id === selectedAppointmentId,
  );
  const selectedServiceOffering = serviceOfferings.find(
    (serviceOffering) => serviceOffering.id === selectedServiceOfferingId,
  );

  const loadBooking = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [servicesResponse, appointmentsResponse, bookingsResponse] =
        await Promise.all([
          serviceOfferingService.getAll(),
          appointmentService.getAll(),
          bookingService.getAll(),
        ]);

      setServiceOfferings(servicesResponse);
      setAppointments(appointmentsResponse);
      setBookings(bookingsResponse);

      if (!routeBookingId) {
        setBooking(null);

        const preselectedAppointment = appointmentsResponse.find(
          (appointment) => String(appointment.id) === initialAppointmentId,
        );

        if (preselectedAppointment) {
          reset(createFormValuesFromAppointment(preselectedAppointment));
          return;
        }

        reset({
          ...emptyBookingFormValues,
          source: initialSource ?? "WalkIn",
          serviceOfferingId:
            servicesResponse.find((service) => service.isActive)?.id ?? 0,
        });
        return;
      }

      const response = await bookingService.getById(routeBookingId);
      setBooking(response);
      reset(toFormValues(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load booking."));
    } finally {
      setIsLoading(false);
    }
  }, [initialAppointmentId, initialSource, reset, routeBookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  function applyAppointment(appointmentId: number) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) {
      return;
    }

    const values = createFormValuesFromAppointment(appointment);
    setValue("customerName", values.customerName);
    setValue("phoneNumber", values.phoneNumber);
    setValue("serviceOfferingId", values.serviceOfferingId);
    setValue("bookingDate", values.bookingDate);
    setValue("bookingTime", values.bookingTime);
  }

  function chooseSource(nextSource: BookingSource) {
    setValue("source", nextSource, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (nextSource === "WalkIn") {
      setValue("appointmentId", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function submit(values: BookingFormValues) {
    if (!canManage) {
      setError("You do not have permission to save bookings.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (booking) {
        await bookingService.update(booking.id, toRequest(values));
        router.replace(bookingListPath);
        return;
      }

      await bookingService.create(toRequest(values));
      router.replace(bookingListPath);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Please review the form and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
            {isEditMode ? "Manage Booking" : "Add Booking"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update the booking without extra steps."
              : "Choose walk-in for quick service, or appointment to copy the scheduled booking."}
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => router.push(bookingListPath)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading booking...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {booking
                  ? booking.source === "Appointment"
                    ? booking.customerName || "Appointment booking"
                    : "Walk-in booking"
                  : "New booking"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {canManage
                  ? "Walk-ins only need a service. Appointment bookings copy customer and service details."
                  : "You can review this page, but saving changes requires booking management access."}
              </p>
            </div>
          </div>

          <form className="space-y-6 p-4 sm:p-5" onSubmit={handleSubmit(submit)}>
            <input type="hidden" {...register("source")} />

            <section className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gold-deep)]">
                  Step 1
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                  How did this customer come in?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <BookingTypeButton
                  icon={<ReceiptText className="h-5 w-5" />}
                  title="Walk-in"
                  description="No customer name needed."
                  active={selectedSource === "WalkIn"}
                  disabled={!canManage || isSubmitting}
                  onClick={() => chooseSource("WalkIn")}
                />
                <BookingTypeButton
                  icon={<CalendarClock className="h-5 w-5" />}
                  title="Appointment"
                  description="Pick a scheduled appointment."
                  active={selectedSource === "Appointment"}
                  disabled={!canManage || isSubmitting}
                  onClick={() => chooseSource("Appointment")}
                />
              </div>
              {errors.source?.message ? (
                <p className="text-xs text-rose-600">{errors.source.message}</p>
              ) : null}
            </section>

            <section className="space-y-3 border-t border-black/8 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gold-deep)]">
                  Step 2
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                  {selectedSource === "Appointment"
                    ? "Choose the appointment"
                    : "Choose the service"}
                </h2>
              </div>

              {selectedSource === "Appointment" ? (
                <div className="space-y-3">
                  <Select
                    label="Appointment"
                    required
                    icon={<CalendarClock className="h-4 w-4" />}
                    error={errors.appointmentId?.message}
                    disabled={!canManage || isSubmitting}
                    searchPlaceholder="Search appointments..."
                    emptyMessage="No available appointments found."
                    options={[
                      { label: "Select appointment", value: "0" },
                      ...availableAppointments.map((appointment) => ({
                        label: `${appointment.customerName} - ${appointment.serviceName}`,
                        value: String(appointment.id),
                        keywords: [
                          appointment.phoneNumber ?? "",
                          formatBookingDateTime(appointment.scheduledAt),
                        ],
                      })),
                    ]}
                    {...register("appointmentId", {
                      setValueAs: numberOrZero,
                      onChange: (event) => {
                        applyAppointment(Number(event.target.value) || 0);
                      },
                    })}
                  />
                  {availableAppointments.length === 0 ? (
                    <div className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
                      No scheduled appointments are available for booking.
                    </div>
                  ) : null}
                </div>
              ) : (
                <Select
                  label="Service"
                  required
                  icon={<Sparkles className="h-4 w-4" />}
                  error={errors.serviceOfferingId?.message}
                  disabled={!canManage || isSubmitting}
                  searchPlaceholder="Search services..."
                  emptyMessage="No services found."
                  options={[
                    { label: "Select service", value: "0" },
                    ...serviceOfferings.map((serviceOffering) => ({
                      label: serviceOffering.isActive
                        ? serviceOffering.name
                        : `${serviceOffering.name} (Inactive)`,
                      value: String(serviceOffering.id),
                      keywords: [serviceOffering.category],
                    })),
                  ]}
                  {...register("serviceOfferingId", {
                    setValueAs: numberOrZero,
                  })}
                />
              )}
            </section>

            {selectedSource === "Appointment" && selectedAppointment ? (
              <div className="grid gap-3 rounded-[18px] border border-black/8 bg-white/75 p-4 text-sm text-[var(--color-muted)] md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Customer
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">
                    {selectedAppointment.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Service
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">
                    {selectedAppointment.serviceName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Appointment
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">
                    {formatBookingDateTime(selectedAppointment.scheduledAt)}
                  </p>
                </div>
              </div>
            ) : null}

            {selectedSource === "WalkIn" ? (
              <section className="space-y-3 border-t border-black/8 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gold-deep)]">
                    Optional
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                    Add phone number
                  </h2>
                </div>
                <Input
                  label="Phone Number"
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="Optional"
                  error={errors.phoneNumber?.message}
                  disabled={!canManage || isSubmitting}
                  {...register("phoneNumber")}
                />
              </section>
            ) : null}

            <section className="space-y-3 border-t border-black/8 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gold-deep)]">
                  Step 3
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                  Confirm date and status
                </h2>
              </div>
              <div className="grid gap-5 xl:grid-cols-3">
                <Input
                  label="Booking Date"
                  type="date"
                  required
                  icon={<CalendarClock className="h-4 w-4" />}
                  error={errors.bookingDate?.message}
                  disabled={!canManage || isSubmitting}
                  {...register("bookingDate")}
                />
                <Input
                  label="Booking Time"
                  type="time"
                  required
                  icon={<Clock3 className="h-4 w-4" />}
                  error={errors.bookingTime?.message}
                  disabled={!canManage || isSubmitting}
                  {...register("bookingTime")}
                />
                <Select
                  label="Status"
                  error={errors.status?.message}
                  disabled={!canManage || isSubmitting}
                  searchPlaceholder="Search status..."
                  options={bookingStatuses.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  {...register("status")}
                />
              </div>
            </section>

            {selectedSource === "WalkIn" && selectedServiceOffering ? (
              <BookingSummary
                title="Ready for walk-in"
                details={[
                  selectedServiceOffering.name,
                  typeof selectedServiceOffering.price === "number"
                    ? formatCurrency(selectedServiceOffering.price)
                    : "Price not set",
                ]}
              />
            ) : null}

            <section className="space-y-3 border-t border-black/8 pt-5">
              <Textarea
                label="Notes"
                rows={3}
                icon={<NotebookPen className="h-4 w-4" />}
                helperText="Optional"
                error={errors.notes?.message}
                disabled={!canManage || isSubmitting}
                {...register("notes")}
              />
            </section>

            <div className="sticky bottom-0 z-20 -mx-4 grid gap-3 border-t border-black/8 bg-[var(--color-card)] px-4 py-4 shadow-[0_-18px_34px_rgba(17,12,7,0.08)] sm:static sm:mx-0 sm:flex sm:justify-end sm:bg-transparent sm:px-0 sm:pt-5 sm:shadow-none">
              <Button
                variant="ghost"
                type="button"
                className="h-12 w-full sm:w-auto"
                onClick={() => router.push(bookingListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canManage ? (
                <Button
                  type="submit"
                  className="h-12 w-full sm:w-auto"
                  loading={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {booking ? "Save booking" : "Create booking"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function BookingTypeButton({
  icon,
  title,
  description,
  active,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        active
          ? "flex min-h-20 items-center gap-3 rounded-[18px] border border-[var(--color-gold)] bg-[rgba(212,175,55,0.16)] px-4 py-3 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          : "flex min-h-20 items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[rgba(212,175,55,0.46)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      <span
        className={
          active
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-black)] text-[var(--color-gold)]"
            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-[var(--color-muted)]"
        }
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-[var(--color-ink)]">
          {title}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-[var(--color-muted)]">
          {description}
        </span>
      </span>
    </button>
  );
}

function BookingSummary({
  title,
  details,
}: {
  title: string;
  details: string[];
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(212,175,55,0.32)] bg-[rgba(212,175,55,0.1)] px-4 py-3">
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {details.map((detail) => (
          <span
            key={detail}
            className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
          >
            {detail}
          </span>
        ))}
      </div>
    </div>
  );
}
