/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import {
  CalendarDays,
  LayoutList,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import {
  formatAppointmentDateTime,
  getTodayDateInputValue,
  sortAppointments,
} from "../appointmentPageUtils";

export function AppointmentCalendarPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("appointments.manage");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const events = useMemo<EventInput[]>(
    () =>
      appointments.map((appointment) => ({
        id: String(appointment.id),
        title: `${appointment.customerName} - ${appointment.serviceName}`,
        start: appointment.scheduledAt,
        classNames: [
          "appointment-calendar-event",
          `appointment-calendar-event-${appointment.status.toLowerCase()}`,
        ],
        extendedProps: {
          status: appointment.status,
        },
      })),
    [appointments],
  );

  const scheduledCount = appointments.filter(
    (appointment) => appointment.status === "Scheduled",
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "Completed",
  ).length;
  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "Cancelled",
  ).length;

  async function loadAppointments() {
    try {
      setError(null);
      setIsLoading(true);
      const response = await appointmentService.getAll();
      setAppointments(sortAppointments(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load appointments."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, []);

  function openNewAppointment(date = getTodayDateInputValue()) {
    router.push(`/operations/appointments/new?date=${date}`);
  }

  function handleDateClick(event: DateClickArg) {
    if (!canManage) {
      setError("You do not have permission to add appointments.");
      return;
    }

    openNewAppointment(event.dateStr);
  }

  function handleEventClick(event: EventClickArg) {
    router.push(`/operations/appointments/${event.event.id}`);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Appointment Calendar
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Click a date to add an appointment, or open an existing booking from
            the calendar.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/operations/appointments")}
          >
            <LayoutList className="h-4 w-4" />
            List
          </Button>
          <Button
            variant="outline"
            onClick={() => void loadAppointments()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canManage ? (
            <Button onClick={() => openNewAppointment()}>
              <Plus className="h-4 w-4" />
              Add appointment
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <CalendarMetric label="Scheduled" value={scheduledCount} status="Scheduled" />
        <CalendarMetric label="Completed" value={completedCount} status="Completed" />
        <CalendarMetric label="Cancelled" value={cancelledCount} status="Cancelled" />
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Month view
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              {isLoading
                ? "Loading appointments..."
                : `${appointments.length} appointments on the calendar`}
            </p>
          </div>
        </div>

        <div className="appointments-calendar bg-white/70 p-3 sm:p-5">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            displayEventTime
            nowIndicator
            fixedWeekCount={false}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth",
            }}
            eventDidMount={(info) => {
              const status = info.event.extendedProps
                .status as AppointmentStatus;
              info.el.title = `${info.event.title} (${status})`;
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 text-sm text-[var(--color-muted)] sm:grid-cols-3">
        {appointments.slice(0, 3).map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-[22px] border border-black/8 bg-white/75 p-4"
          >
            <p className="font-semibold text-[var(--color-ink)]">
              {appointment.customerName}
            </p>
            <p className="mt-1 line-clamp-1">{appointment.serviceName}</p>
            <p className="mt-2 text-xs">
              {formatAppointmentDateTime(appointment.scheduledAt)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CalendarMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: AppointmentStatus;
}) {
  const classes =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Cancelled"
        ? "bg-rose-50 text-rose-700"
        : "bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]";

  return (
    <article className="rounded-[22px] border border-black/8 bg-white/75 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)]">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </span>
      <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </article>
  );
}
