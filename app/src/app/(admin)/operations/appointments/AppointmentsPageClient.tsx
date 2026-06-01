/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutList,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment } from "@/types/appointment";
import {
  appointmentStatuses,
  formatAppointmentDate,
  formatAppointmentDateTime,
  formatAppointmentTime,
  isSameLocalDate,
  sortAppointments,
  type StatusFilter,
} from "./appointmentPageUtils";

const defaultPageSize = 10;
const pageSizeOptions = [10, 25, 50, 100];

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);
  const pages: Array<number | "ellipsis"> = [1];

  if (windowStart > 2) {
    pages.push("ellipsis");
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.push(page);
  }

  if (windowEnd < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export function AppointmentsPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("appointments.manage");
  const canManageBookings = isAdmin || permissions.includes("pos.manage");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          appointment.customerName,
          appointment.phoneNumber,
          appointment.serviceName,
          appointment.status,
          appointment.notes,
          formatAppointmentDateTime(appointment.scheduledAt),
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const totalCount = filteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPageNumber = Math.min(pageNumber, totalPages);
  const hasPreviousPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalPages;
  const firstItemNumber =
    totalCount === 0 ? 0 : (currentPageNumber - 1) * pageSize + 1;
  const lastItemNumber = Math.min(currentPageNumber * pageSize, totalCount);
  const visiblePageNumbers = buildVisiblePageNumbers(
    currentPageNumber,
    totalPages,
  );
  const pagedAppointments = useMemo(() => {
    const startIndex = (currentPageNumber - 1) * pageSize;
    return filteredAppointments.slice(startIndex, startIndex + pageSize);
  }, [currentPageNumber, filteredAppointments, pageSize]);

  const today = new Date();
  const todayCount = appointments.filter((appointment) =>
    isSameLocalDate(new Date(appointment.scheduledAt), today),
  ).length;
  const upcomingCount = appointments.filter(
    (appointment) =>
      appointment.status === "Scheduled" &&
      new Date(appointment.scheduledAt).getTime() >= today.getTime(),
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "Completed",
  ).length;

  async function loadAppointments() {
    try {
      setError(null);
      setSuccessMessage(null);
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

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  function openNewAppointment() {
    router.push("/operations/appointments/new");
  }

  function openAppointment(appointment: Appointment) {
    router.push(`/operations/appointments/${appointment.id}`);
  }

  function openBookingFromAppointment(appointment: Appointment) {
    router.push(`/operations/pos/new?appointmentId=${appointment.id}`);
  }

  async function handleDelete(appointment: Appointment) {
    if (!canManage) {
      setError("You do not have permission to delete appointments.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${appointment.customerName}'s appointment?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(appointment.id);
      setError(null);
      setSuccessMessage(null);
      await appointmentService.delete(appointment.id);
      setAppointments((current) =>
        current.filter((item) => item.id !== appointment.id),
      );
      setSuccessMessage("Appointment was deleted successfully.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Unable to delete appointment."));
    } finally {
      setDeletingId(null);
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
            Appointments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Simple booking records for customer, service, date, time, and status.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/operations/appointments/calendar")}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant="outline"
            onClick={() => void loadAppointments()}
            disabled={isLoading || deletingId !== null}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canManage ? (
            <Button onClick={openNewAppointment}>
              <Plus className="h-4 w-4" />
              Add appointment
            </Button>
          ) : null}
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total" value={appointments.length} />
        <MetricTile label="Today" value={todayCount} />
        <MetricTile label="Upcoming" value={upcomingCount} />
        <MetricTile label="Completed" value={completedCount} />
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <LayoutList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Appointment list
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {filteredAppointments.length} of {appointments.length}{" "}
                appointments shown
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(1);
              }}
              placeholder="Search appointments"
            />
            <Select
              label="Status"
              value={statusFilter}
              searchPlaceholder="Search status..."
              options={[
                { label: "All status", value: "all" },
                ...appointmentStatuses.map((status) => ({
                  label: status,
                  value: status,
                })),
              ]}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPageNumber(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            Loading appointments...
          </div>
        ) : null}

        {!isLoading && filteredAppointments.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            No appointments matched the current filters.
          </div>
        ) : null}

        {!isLoading && filteredAppointments.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4">Schedule</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {pagedAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="bg-white/55 align-top transition hover:bg-white/78"
                    >
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[var(--color-ink)]">
                            {formatAppointmentDate(appointment.scheduledAt)}
                          </p>
                          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            {formatAppointmentTime(appointment.scheduledAt)}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[280px] px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="block max-w-full truncate text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                              onClick={() => openAppointment(appointment)}
                            >
                              {appointment.customerName}
                            </button>
                            <p className="mt-1 truncate text-xs leading-5 text-[var(--color-muted)]">
                              {appointment.phoneNumber || "No phone number"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[var(--color-ink)]">
                            {appointment.serviceName}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {typeof appointment.servicePrice === "number"
                              ? formatCurrency(appointment.servicePrice)
                              : "Price not set"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={appointment.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {canManageBookings &&
                          appointment.status === "Scheduled" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openBookingFromAppointment(appointment)
                              }
                            >
                              <ReceiptText className="h-4 w-4" />
                              Book
                            </Button>
                          ) : null}
                          {canManage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointment(appointment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          ) : null}
                          {canManage ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="h-10 w-10 px-0"
                              loading={deletingId === appointment.id}
                              title={`Delete ${appointment.customerName}'s appointment`}
                              aria-label={`Delete ${appointment.customerName}'s appointment`}
                              onClick={() => void handleDelete(appointment)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-black/6 lg:hidden">
              {pagedAppointments.map((appointment) => (
                <article key={appointment.id} className="bg-white/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="line-clamp-1 text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline"
                          onClick={() => openAppointment(appointment)}
                        >
                          {appointment.customerName}
                        </button>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                          {appointment.serviceName}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={appointment.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatAppointmentDate(appointment.scheduledAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {formatAppointmentTime(appointment.scheduledAt)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {canManageBookings && appointment.status === "Scheduled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBookingFromAppointment(appointment)}
                      >
                        <ReceiptText className="h-4 w-4" />
                        Book
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAppointment(appointment)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === appointment.id}
                        onClick={() => void handleDelete(appointment)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <TablePager
              pageNumber={currentPageNumber}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              firstItemNumber={firstItemNumber}
              lastItemNumber={lastItemNumber}
              hasPreviousPage={hasPreviousPage}
              hasNextPage={hasNextPage}
              visiblePageNumbers={visiblePageNumbers}
              onPageChange={setPageNumber}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPageNumber(1);
              }}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

function TablePager({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  firstItemNumber,
  lastItemNumber,
  hasPreviousPage,
  hasNextPage,
  visiblePageNumbers,
  onPageChange,
  onPageSizeChange,
}: {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  firstItemNumber: number;
  lastItemNumber: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  visiblePageNumbers: Array<number | "ellipsis">;
  onPageChange: (pageNumber: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-black/6 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="inline-flex items-center justify-between gap-3 text-sm text-[var(--color-muted)] sm:justify-start">
          <span>Rows Per Page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-[var(--color-ink)] shadow-sm transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)]"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-[var(--color-muted)]">
          Showing {firstItemNumber}-{lastItemNumber} of {totalCount}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          className="w-full sm:w-auto"
          onClick={() => onPageChange(Math.max(pageNumber - 1, 1))}
        >
          Previous
        </Button>
        <div className="order-first col-span-2 flex items-center gap-2 overflow-x-auto pb-1 sm:order-none sm:col-span-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {visiblePageNumbers.map((entry, index) =>
            entry === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-sm text-[var(--color-muted)]"
              >
                ...
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === pageNumber ? "primary" : "outline"}
                size="sm"
                className="min-w-10"
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </Button>
            ),
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          className="w-full sm:w-auto"
          onClick={() => onPageChange(Math.min(pageNumber + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[22px] border border-black/8 bg-white/75 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </article>
  );
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  const classes =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Cancelled"
        ? "bg-rose-50 text-rose-700"
        : "bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {status === "Completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {status === "Scheduled" ? <Sparkles className="h-3.5 w-3.5" /> : null}
      {status}
    </span>
  );
}
