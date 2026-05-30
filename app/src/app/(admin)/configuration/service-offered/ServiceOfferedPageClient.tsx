/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock3,
  Home,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { serviceCategoryService } from "@/services/serviceCategoryService";
import { serviceOfferingService } from "@/services/serviceOfferingService";
import type { ServiceCategory } from "@/types/serviceCategory";
import type { ServiceOffering } from "@/types/serviceOffering";
import {
  formatDuration,
  formatPrice,
  getServiceOfferingCategories,
  sortServiceOfferings,
  type StatusFilter,
} from "./serviceOfferingPageUtils";

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

export function ServiceOfferedPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canCreate = isAdmin || permissions.includes("service_offerings.create");
  const canUpdate = isAdmin || permissions.includes("service_offerings.update");
  const canDelete = isAdmin || permissions.includes("service_offerings.delete");
  const [serviceOfferings, setServiceOfferings] = useState<ServiceOffering[]>(
    [],
  );
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = useMemo(
    () => getServiceOfferingCategories(serviceOfferings, serviceCategories),
    [serviceCategories, serviceOfferings],
  );

  const filteredServiceOfferings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return serviceOfferings.filter((serviceOffering) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          serviceOffering.name,
          serviceOffering.category,
          serviceOffering.description,
          serviceOffering.addOnDetails,
          serviceOffering.addOnRate?.toString(),
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));

      const matchesCategory =
        categoryFilter === "all" || serviceOffering.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && serviceOffering.isActive) ||
        (statusFilter === "inactive" && !serviceOffering.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, search, serviceOfferings, statusFilter]);
  const totalCount = filteredServiceOfferings.length;
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
  const pagedServiceOfferings = useMemo(() => {
    const startIndex = (currentPageNumber - 1) * pageSize;
    return filteredServiceOfferings.slice(startIndex, startIndex + pageSize);
  }, [currentPageNumber, filteredServiceOfferings, pageSize]);

  const activeCount = serviceOfferings.filter(
    (serviceOffering) => serviceOffering.isActive,
  ).length;
  const homeServiceCount = serviceOfferings.filter(
    (serviceOffering) => serviceOffering.isHomeService,
  ).length;
  const pricedServices = serviceOfferings.filter(
    (serviceOffering) => typeof serviceOffering.price === "number",
  );
  const minPrice =
    pricedServices.length > 0
      ? Math.min(
          ...pricedServices.map(
            (serviceOffering) => serviceOffering.price ?? 0,
          ),
        )
      : null;
  const maxPrice =
    pricedServices.length > 0
      ? Math.max(
          ...pricedServices.map(
            (serviceOffering) => serviceOffering.price ?? 0,
          ),
        )
      : null;

  async function loadServiceOfferings() {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      const [serviceResponse, categoryResponse] = await Promise.all([
        serviceOfferingService.getAll(),
        serviceCategoryService.getAll(),
      ]);
      setServiceOfferings(sortServiceOfferings(serviceResponse));
      setServiceCategories(categoryResponse);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load service offerings."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServiceOfferings();
  }, []);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  function openNewService() {
    router.push("/configuration/service-offered/new");
  }

  function openService(serviceOffering: ServiceOffering) {
    router.push(`/configuration/service-offered/${serviceOffering.id}`);
  }

  async function handleDelete(serviceOffering: ServiceOffering) {
    if (!canDelete) {
      setError("You do not have permission to delete service offerings.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${serviceOffering.name}? This removes it from the service list.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(serviceOffering.id);
      setError(null);
      setSuccessMessage(null);
      await serviceOfferingService.delete(serviceOffering.id);
      setServiceOfferings((current) =>
        current.filter((item) => item.id !== serviceOffering.id),
      );
      setSuccessMessage("Service offering was deleted successfully.");
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Unable to delete service offering."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Configuration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Service Offered
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Select a service from the list to manage pricing, duration,
            categories, add-ons, home service tags, and availability.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void loadServiceOfferings()}
            disabled={isLoading || deletingId !== null}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canCreate ? (
            <Button onClick={openNewService}>
              <Plus className="h-4 w-4" />
              Add service
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
        <MetricTile label="Total" value={serviceOfferings.length} />
        <MetricTile label="Active" value={activeCount} />
        <MetricTile label="Home Services" value={homeServiceCount} />
        <article className="rounded-[22px] border border-black/8 bg-white/75 p-4 shadow-[0_14px_30px_rgba(17,12,7,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Price Range
          </p>
          <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
            {minPrice === null || maxPrice === null
              ? "Unset"
              : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
          </p>
        </article>
      </div>

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Service list
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {filteredServiceOfferings.length} of {serviceOfferings.length}{" "}
                services shown
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_160px]">
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(1);
              }}
              placeholder="Search services"
            />
            <Select
              label="Category"
              value={categoryFilter}
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found."
              options={[
                { label: "All categories", value: "all" },
                ...categories.map((category) => ({
                  label: category,
                  value: category,
                })),
              ]}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPageNumber(1);
              }}
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
            Loading services...
          </div>
        ) : null}

        {!isLoading && filteredServiceOfferings.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            No services matched the current filters.
          </div>
        ) : null}

        {!isLoading && filteredServiceOfferings.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {pagedServiceOfferings.map((serviceOffering) => (
                    <tr
                      key={serviceOffering.id}
                      className="bg-white/55 align-top transition hover:bg-white/78"
                    >
                      <td className="max-w-[360px] px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="block max-w-full truncate text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                              onClick={() => openService(serviceOffering)}
                            >
                              {serviceOffering.name}
                            </button>
                            <p className="mt-1 truncate text-xs leading-5 text-[var(--color-muted)]">
                              {serviceOffering.description ||
                                serviceOffering.addOnDetails ||
                                "No description provided."}
                              {serviceOffering.description &&
                              serviceOffering.addOnDetails
                                ? ` - ${serviceOffering.addOnDetails}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex max-w-[220px] flex-wrap gap-2 overflow-hidden">
                          <span className="inline-flex max-w-full truncate rounded-full bg-[rgba(212,175,55,0.14)] px-3 py-1 text-xs font-semibold text-[var(--color-gold-deep)]">
                            {serviceOffering.category}
                          </span>
                          {serviceOffering.isHomeService ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-sage-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-sage)]">
                              <Home className="h-3.5 w-3.5" />
                              Home
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-[var(--color-muted)]">
                          <Clock3 className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                          <span>{formatDuration(serviceOffering.durationMinutes)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[var(--color-ink)]">
                            <CircleDollarSign className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                            <span className="font-semibold">
                              {formatPrice(serviceOffering.price)}
                            </span>
                          </div>
                          {typeof serviceOffering.addOnRate === "number" ? (
                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                              <Plus className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                Add-on {formatPrice(serviceOffering.addOnRate)}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill isActive={serviceOffering.isActive} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {canUpdate ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openService(serviceOffering)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={deletingId === serviceOffering.id}
                              onClick={() => void handleDelete(serviceOffering)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
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
              {pagedServiceOfferings.map((serviceOffering) => (
                <article key={serviceOffering.id} className="bg-white/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.16)] text-[var(--color-gold-deep)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="line-clamp-1 text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline"
                          onClick={() => openService(serviceOffering)}
                        >
                          {serviceOffering.name}
                        </button>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-gold-deep)]">
                          {serviceOffering.category}
                        </p>
                      </div>
                    </div>
                    <StatusPill isActive={serviceOffering.isActive} />
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm leading-6 text-[var(--color-muted)]">
                    {serviceOffering.description ||
                      serviceOffering.addOnDetails ||
                      "No description provided."}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {formatDuration(serviceOffering.durationMinutes)}
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                      <CircleDollarSign className="h-4 w-4" />
                      {formatPrice(serviceOffering.price)}
                    </span>
                    {typeof serviceOffering.addOnRate === "number" ? (
                      <span className="inline-flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add-on {formatPrice(serviceOffering.addOnRate)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {canUpdate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openService(serviceOffering)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === serviceOffering.id}
                        onClick={() => void handleDelete(serviceOffering)}
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
