/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import {
  formatDate,
  sortCustomers,
  type StatusFilter,
} from "./customerPageUtils";

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

export function CustomersPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("customers.manage");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          customer.name,
          customer.phoneNumber,
          customer.email,
          customer.notes,
          customer.visitCount.toString(),
          formatDate(customer.lastVisitAt),
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && customer.isActive) ||
        (statusFilter === "inactive" && !customer.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const totalCount = filteredCustomers.length;
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
  const pagedCustomers = useMemo(() => {
    const startIndex = (currentPageNumber - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [currentPageNumber, filteredCustomers, pageSize]);

  const activeCount = customers.filter((customer) => customer.isActive).length;
  const withVisitCount = customers.filter(
    (customer) => customer.visitCount > 0,
  ).length;
  const latestVisit = customers
    .map((customer) => customer.lastVisitAt)
    .filter((value): value is string => Boolean(value))
    .sort((first, second) => {
      return new Date(second).getTime() - new Date(first).getTime();
    })[0];

  async function loadCustomers() {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      const response = await customerService.getAll();
      setCustomers(sortCustomers(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load customers."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  function openNewCustomer() {
    router.push("/customers/new");
  }

  function openCustomer(customer: Customer) {
    router.push(`/customers/${customer.id}`);
  }

  async function handleDelete(customer: Customer) {
    if (!canManage) {
      setError("You do not have permission to delete customers.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${customer.name}? This removes the customer record.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(customer.id);
      setError(null);
      setSuccessMessage(null);
      await customerService.delete(customer.id);
      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      );
      setSuccessMessage("Customer was deleted successfully.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Unable to delete customer."));
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
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Customer contact records, visit counts, notes, and account status.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void loadCustomers()}
            disabled={isLoading || deletingId !== null}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canManage ? (
            <Button onClick={openNewCustomer}>
              <Plus className="h-4 w-4" />
              Add customer
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
        <MetricTile label="Total" value={customers.length} />
        <MetricTile label="Active" value={activeCount} />
        <MetricTile label="With Visits" value={withVisitCount} />
        <article className="rounded-[22px] border border-black/8 bg-white/75 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Latest Visit
          </p>
          <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
            {formatDate(latestVisit)}
          </p>
        </article>
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Customer list
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {filteredCustomers.length} of {customers.length} customers shown
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
              placeholder="Search customers"
            />
            <Select
              label="Status"
              value={statusFilter}
              searchPlaceholder="Search status..."
              options={[
                { label: "All status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
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
            Loading customers...
          </div>
        ) : null}

        {!isLoading && filteredCustomers.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            No customers matched the current filters.
          </div>
        ) : null}

        {!isLoading && filteredCustomers.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Visit History</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {pagedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="bg-white/55 align-top transition hover:bg-white/78"
                    >
                      <td className="max-w-[320px] px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="block max-w-full truncate text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                              onClick={() => openCustomer(customer)}
                            >
                              {customer.name}
                            </button>
                            <p className="mt-1 truncate text-xs leading-5 text-[var(--color-muted)]">
                              {customer.notes || "No notes provided."}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 text-[var(--color-muted)]">
                          <Phone className="h-4 w-4 shrink-0" />
                          {customer.phoneNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {customer.email ? (
                          <span className="inline-flex max-w-[220px] items-center gap-2 text-[var(--color-muted)]">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </span>
                        ) : (
                          <span className="text-[var(--color-muted)]">
                            Not set
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[var(--color-ink)]">
                            {customer.visitCount}{" "}
                            {customer.visitCount === 1 ? "visit" : "visits"}
                          </p>
                          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            {formatDate(customer.lastVisitAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill isActive={customer.isActive} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {canManage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCustomer(customer)}
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
                              loading={deletingId === customer.id}
                              title={`Delete ${customer.name}`}
                              aria-label={`Delete ${customer.name}`}
                              onClick={() => void handleDelete(customer)}
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
              {pagedCustomers.map((customer) => (
                <article key={customer.id} className="bg-white/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="line-clamp-1 text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline"
                          onClick={() => openCustomer(customer)}
                        >
                          {customer.name}
                        </button>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                          {customer.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <StatusPill isActive={customer.isActive} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                    {customer.notes || "No notes provided."}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">
                        {customer.email || "Email not set"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      {customer.visitCount}{" "}
                      {customer.visitCount === 1 ? "visit" : "visits"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomer(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === customer.id}
                        onClick={() => void handleDelete(customer)}
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

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-black/6 px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
