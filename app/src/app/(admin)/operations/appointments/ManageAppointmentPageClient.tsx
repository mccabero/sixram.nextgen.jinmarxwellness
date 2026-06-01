/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  NotebookPen,
  Phone,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { appointmentService } from "@/services/appointmentService";
import { serviceOfferingService } from "@/services/serviceOfferingService";
import type { Appointment } from "@/types/appointment";
import type { ServiceOffering } from "@/types/serviceOffering";
import {
  appointmentSchema,
  appointmentStatuses,
  createEmptyAppointmentFormValues,
  numberOrZero,
  toFormValues,
  toRequest,
  type AppointmentFormValues,
} from "./appointmentPageUtils";

type ManageAppointmentPageClientProps = {
  appointmentId?: string;
  initialDate?: string;
};

const appointmentListPath = "/operations/appointments";

export function ManageAppointmentPageClient({
  appointmentId,
  initialDate,
}: ManageAppointmentPageClientProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeAppointmentId = appointmentId ?? params.id;
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("appointments.manage");
  const isEditMode = Boolean(routeAppointmentId);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [serviceOfferings, setServiceOfferings] = useState<ServiceOffering[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: createEmptyAppointmentFormValues(initialDate),
  });

  const loadAppointment = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const services = await serviceOfferingService.getAll();
      setServiceOfferings(services);

      if (!routeAppointmentId) {
        setAppointment(null);
        reset({
          ...createEmptyAppointmentFormValues(initialDate),
          serviceOfferingId: services.find((service) => service.isActive)?.id ?? 0,
        });
        return;
      }

      const response = await appointmentService.getById(routeAppointmentId);
      setAppointment(response);
      reset(toFormValues(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load appointment."));
    } finally {
      setIsLoading(false);
    }
  }, [initialDate, reset, routeAppointmentId]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  async function submit(values: AppointmentFormValues) {
    if (!canManage) {
      setError("You do not have permission to save appointments.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (appointment) {
        await appointmentService.update(appointment.id, toRequest(values));
        router.replace(appointmentListPath);
        return;
      }

      await appointmentService.create(toRequest(values));
      router.replace(appointmentListPath);
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
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            {isEditMode ? "Manage Appointment" : "Add Appointment"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update the customer, service, schedule, and appointment status."
              : "Create a simple booking with the essential details only."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/operations/appointments/calendar")}
          >
            <CalendarClock className="h-4 w-4" />
            Calendar
          </Button>
          <Button variant="ghost" onClick={() => router.push(appointmentListPath)}>
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading appointment...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {appointment ? appointment.customerName : "New appointment"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {canManage
                  ? "Keep the booking clear for daily front desk work."
                  : "You can review this page, but saving changes requires appointment management access."}
              </p>
            </div>
          </div>

          <form className="space-y-5 p-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-5 xl:grid-cols-2">
              <Input
                label="Customer Name"
                required
                icon={<UserRound className="h-4 w-4" />}
                error={errors.customerName?.message}
                disabled={!canManage || isSubmitting}
                {...register("customerName")}
              />
              <Input
                label="Phone Number"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phoneNumber?.message}
                disabled={!canManage || isSubmitting}
                {...register("phoneNumber")}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_180px_160px]">
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
                {...register("serviceOfferingId", { setValueAs: numberOrZero })}
              />
              <Input
                label="Date"
                type="date"
                required
                icon={<CalendarClock className="h-4 w-4" />}
                error={errors.appointmentDate?.message}
                disabled={!canManage || isSubmitting}
                {...register("appointmentDate")}
              />
              <Input
                label="Time"
                type="time"
                required
                icon={<Clock3 className="h-4 w-4" />}
                error={errors.appointmentTime?.message}
                disabled={!canManage || isSubmitting}
                {...register("appointmentTime")}
              />
            </div>

            <Select
              label="Status"
              error={errors.status?.message}
              disabled={!canManage || isSubmitting}
              searchPlaceholder="Search status..."
              options={appointmentStatuses.map((status) => ({
                label: status,
                value: status,
              }))}
              {...register("status")}
            />

            <Textarea
              label="Notes"
              rows={4}
              icon={<NotebookPen className="h-4 w-4" />}
              error={errors.notes?.message}
              disabled={!canManage || isSubmitting}
              {...register("notes")}
            />

            <div className="grid gap-3 border-t border-black/8 pt-5 sm:flex sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push(appointmentListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canManage ? (
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {appointment ? "Save appointment" : "Create appointment"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
