/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { bookingService } from "@/services/bookingService";
import type { Booking } from "@/types/booking";
import {
  bookingStatuses,
  formatBookingDate,
  formatBookingDateTime,
  formatBookingTime,
  sortBookings,
  type SourceFilter,
  type StatusFilter,
} from "./bookingPageUtils";

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

export function BookingsPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("pos.manage");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          booking.customerName,
          booking.phoneNumber,
          booking.serviceName,
          booking.source,
          booking.status,
          booking.notes,
          formatBookingDateTime(booking.bookedAt),
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesSource =
        sourceFilter === "all" || booking.source === sourceFilter;
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [bookings, search, sourceFilter, statusFilter]);

  const totalCount = filteredBookings.length;
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
  const pagedBookings = useMemo(() => {
    const startIndex = (currentPageNumber - 1) * pageSize;
    return filteredBookings.slice(startIndex, startIndex + pageSize);
  }, [currentPageNumber, filteredBookings, pageSize]);

  const walkInCount = bookings.filter(
    (booking) => booking.source === "WalkIn",
  ).length;
  const appointmentCount = bookings.filter(
    (booking) => booking.source === "Appointment",
  ).length;
  const openCount = bookings.filter((booking) => booking.status === "Open")
    .length;

  async function loadBookings() {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      const response = await bookingService.getAll();
      setBookings(sortBookings(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load bookings."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  function openNewBooking() {
    router.push("/operations/pos/new");
  }

  function openAppointmentBooking() {
    router.push("/operations/pos/new?source=Appointment");
  }

  function openBooking(booking: Booking) {
    router.push(`/operations/pos/${booking.id}`);
  }

  function applyQuickFilter(
    nextSourceFilter: SourceFilter,
    nextStatusFilter: StatusFilter,
  ) {
    setSourceFilter(nextSourceFilter);
    setStatusFilter(nextStatusFilter);
    setPageNumber(1);
  }

  async function handleDelete(booking: Booking) {
    if (!canManage) {
      setError("You do not have permission to delete bookings.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete this ${booking.source === "WalkIn" ? "walk-in" : "appointment"} booking?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(booking.id);
      setError(null);
      setSuccessMessage(null);
      await bookingService.delete(booking.id);
      setBookings((current) => current.filter((item) => item.id !== booking.id));
      setSuccessMessage("Booking was deleted successfully.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Unable to delete booking."));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleComplete(booking: Booking) {
    if (!canManage) {
      setError("You do not have permission to complete bookings.");
      return;
    }

    if (booking.status !== "Open") {
      return;
    }

    try {
      setCompletingId(booking.id);
      setError(null);
      setSuccessMessage(null);
      const completedBooking = await bookingService.update(booking.id, {
        source: booking.source,
        appointmentId: booking.appointmentId ?? null,
        customerName: booking.customerName ?? null,
        phoneNumber: booking.phoneNumber ?? null,
        serviceOfferingId: booking.serviceOfferingId,
        bookedAt: booking.bookedAt,
        status: "Completed",
        notes: booking.notes ?? null,
      });

      setBookings((current) =>
        sortBookings(
          current.map((item) =>
            item.id === booking.id ? completedBooking : item,
          ),
        ),
      );
      setSuccessMessage("Booking was completed successfully.");
    } catch (completeError) {
      setError(getErrorMessage(completeError, "Unable to complete booking."));
    } finally {
      setCompletingId(null);
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
            Bookings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Start a walk-in quickly, or convert a scheduled appointment into a
            booking.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void loadBookings()}
            disabled={
              isLoading || deletingId !== null || completingId !== null
            }
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canManage ? (
            <Button className="w-full sm:w-auto" onClick={openNewBooking}>
              <Plus className="h-4 w-4" />
              Add booking
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

      <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total" value={bookings.length} />
        <MetricTile label="Walk-ins" value={walkInCount} />
        <MetricTile label="Appointments" value={appointmentCount} />
        <MetricTile label="Open" value={openCount} />
      </div>

      {canManage ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-14 justify-start px-4 text-left"
            onClick={openNewBooking}
          >
            <ReceiptText className="h-5 w-5" />
            Walk-in booking
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 justify-start bg-white/70 px-4 text-left"
            onClick={openAppointmentBooking}
          >
            <CalendarClock className="h-5 w-5" />
            From appointment
          </Button>
        </div>
      ) : null}

      <MobileBookingSummary
        totalCount={bookings.length}
        walkInCount={walkInCount}
        appointmentCount={appointmentCount}
        openCount={openCount}
        sourceFilter={sourceFilter}
        statusFilter={statusFilter}
        onFilterChange={applyQuickFilter}
      />

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-4 py-5 sm:px-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Booking list
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {filteredBookings.length} of {bookings.length} bookings shown
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(1);
              }}
              placeholder="Search bookings"
            />
            <Select
              label="Source"
              value={sourceFilter}
              searchPlaceholder="Search source..."
              options={[
                { label: "All sources", value: "all" },
                { label: "Walk-in", value: "WalkIn" },
                { label: "Appointment", value: "Appointment" },
              ]}
              onChange={(event) => {
                setSourceFilter(event.target.value as SourceFilter);
                setPageNumber(1);
              }}
            />
            <Select
              label="Status"
              value={statusFilter}
              searchPlaceholder="Search status..."
              options={[
                { label: "All status", value: "all" },
                ...bookingStatuses.map((status) => ({
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
            Loading bookings...
          </div>
        ) : null}

        {!isLoading && filteredBookings.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            No bookings matched the current filters.
          </div>
        ) : null}

        {!isLoading && filteredBookings.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4">Booking</th>
                    <th className="px-5 py-4">Source</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {pagedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="bg-white/55 align-top transition hover:bg-white/78"
                    >
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <button
                            type="button"
                            className="block text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                            onClick={() => openBooking(booking)}
                          >
                            {formatBookingDate(booking.bookedAt)}
                          </button>
                          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            {formatBookingTime(booking.bookedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <SourcePill source={booking.source} />
                      </td>
                      <td className="max-w-[240px] px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                            {booking.source === "Appointment" ? (
                              <UserRound className="h-4 w-4" />
                            ) : (
                              <UsersRound className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--color-ink)]">
                              {booking.source === "Appointment"
                                ? booking.customerName || "Appointment customer"
                                : "Walk-in"}
                            </p>
                            <p className="mt-1 truncate text-xs leading-5 text-[var(--color-muted)]">
                              {booking.phoneNumber || "No phone number"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[var(--color-ink)]">
                            {booking.serviceName}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {typeof booking.servicePrice === "number"
                              ? formatCurrency(booking.servicePrice)
                              : "Price not set"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={booking.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {canManage && booking.status === "Open" ? (
                            <Button
                              size="sm"
                              loading={completingId === booking.id}
                              onClick={() => void handleComplete(booking)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Complete
                            </Button>
                          ) : null}
                          {canManage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBooking(booking)}
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
                              loading={deletingId === booking.id}
                              title="Delete booking"
                              aria-label="Delete booking"
                              onClick={() => void handleDelete(booking)}
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

            <div className="space-y-3 p-3 lg:hidden">
              {pagedBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[22px] border border-black/8 bg-white/75 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="line-clamp-1 text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline"
                        onClick={() => openBooking(booking)}
                      >
                        {booking.source === "Appointment"
                          ? booking.customerName || "Appointment booking"
                          : "Walk-in booking"}
                      </button>
                      <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                        {booking.serviceName}
                      </p>
                    </div>
                    <StatusPill status={booking.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      {formatBookingDateTime(booking.bookedAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <ReceiptText className="h-4 w-4" />
                      {booking.source === "WalkIn" ? "Walk-in" : "Appointment"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {canManage && booking.status === "Open" ? (
                      <Button
                        size="md"
                        className="w-full"
                        loading={completingId === booking.id}
                        onClick={() => void handleComplete(booking)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </Button>
                    ) : null}
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {canManage ? (
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full"
                          onClick={() => openBooking(booking)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      ) : null}
                      {canManage ? (
                        <Button
                          variant="danger"
                          size="md"
                          className="h-11 w-11 px-0"
                          loading={deletingId === booking.id}
                          title="Delete booking"
                          aria-label="Delete booking"
                          onClick={() => void handleDelete(booking)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
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

function MobileBookingSummary({
  totalCount,
  walkInCount,
  appointmentCount,
  openCount,
  sourceFilter,
  statusFilter,
  onFilterChange,
}: {
  totalCount: number;
  walkInCount: number;
  appointmentCount: number;
  openCount: number;
  sourceFilter: SourceFilter;
  statusFilter: StatusFilter;
  onFilterChange: (sourceFilter: SourceFilter, statusFilter: StatusFilter) => void;
}) {
  const shortcuts = [
    {
      label: "All",
      value: totalCount,
      active: sourceFilter === "all" && statusFilter === "all",
      onClick: () => onFilterChange("all", "all"),
    },
    {
      label: "Open",
      value: openCount,
      active: sourceFilter === "all" && statusFilter === "Open",
      onClick: () => onFilterChange("all", "Open"),
    },
    {
      label: "Walk-in",
      value: walkInCount,
      active: sourceFilter === "WalkIn" && statusFilter === "all",
      onClick: () => onFilterChange("WalkIn", "all"),
    },
    {
      label: "Appointment",
      value: appointmentCount,
      active: sourceFilter === "Appointment" && statusFilter === "all",
      onClick: () => onFilterChange("Appointment", "all"),
    },
  ];

  return (
    <div className="sm:hidden">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            aria-pressed={shortcut.active}
            className={
              shortcut.active
                ? "flex min-w-[82px] shrink-0 items-center justify-between gap-2 rounded-2xl bg-[var(--color-black)] px-3 py-2 text-left text-white shadow-sm"
                : "flex min-w-[82px] shrink-0 items-center justify-between gap-2 rounded-2xl border border-black/8 bg-white/70 px-3 py-2 text-left text-[var(--color-ink)]"
            }
            onClick={shortcut.onClick}
          >
            <span className="text-xs font-semibold">{shortcut.label}</span>
            <span
              className={
                shortcut.active
                  ? "text-sm font-semibold text-[var(--color-gold)]"
                  : "text-sm font-semibold text-[var(--color-gold-deep)]"
              }
            >
              {shortcut.value}
            </span>
          </button>
        ))}
      </div>
    </div>
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

function SourcePill({ source }: { source: Booking["source"] }) {
  return (
    <span
      className={
        source === "Appointment"
          ? "inline-flex rounded-full bg-[rgba(212,175,55,0.16)] px-3 py-1 text-xs font-semibold text-[var(--color-gold-deep)]"
          : "inline-flex rounded-full bg-[var(--color-sage-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-sage)]"
      }
    >
      {source === "WalkIn" ? "Walk-in" : "Appointment"}
    </span>
  );
}

function StatusPill({ status }: { status: Booking["status"] }) {
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
      {status === "Open" ? <Sparkles className="h-3.5 w-3.5" /> : null}
      {status}
    </span>
  );
}
