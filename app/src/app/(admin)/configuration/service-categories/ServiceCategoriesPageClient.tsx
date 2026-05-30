/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { serviceCategoryService } from "@/services/serviceCategoryService";
import type { ServiceCategory } from "@/types/serviceCategory";
import { sortServiceCategories } from "./serviceCategoryPageUtils";

export function ServiceCategoriesPageClient() {
  const router = useRouter();
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canCreate = isAdmin || permissions.includes("service_categories.create");
  const canUpdate = isAdmin || permissions.includes("service_categories.update");
  const canDelete = isAdmin || permissions.includes("service_categories.delete");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredServiceCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return serviceCategories;
    }

    return serviceCategories.filter((serviceCategory) =>
      [serviceCategory.name, serviceCategory.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch)),
    );
  }, [search, serviceCategories]);

  async function loadServiceCategories() {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      const response = await serviceCategoryService.getAll();
      setServiceCategories(sortServiceCategories(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load service categories."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServiceCategories();
  }, []);

  function openNewCategory() {
    router.push("/configuration/service-categories/new");
  }

  function openCategory(serviceCategory: ServiceCategory) {
    router.push(`/configuration/service-categories/${serviceCategory.id}`);
  }

  async function handleDelete(serviceCategory: ServiceCategory) {
    if (!canDelete) {
      setError("You do not have permission to delete service categories.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${serviceCategory.name}? Services assigned to this category will prevent deletion.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(serviceCategory.id);
      setError(null);
      setSuccessMessage(null);
      await serviceCategoryService.delete(serviceCategory.id);
      setServiceCategories((current) =>
        current.filter((item) => item.id !== serviceCategory.id),
      );
      setSuccessMessage("Service category was deleted successfully.");
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Unable to delete service category."),
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
            Service Categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Group service offerings for filtering, menus, bookings, and
            checkout.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void loadServiceCategories()}
            disabled={isLoading || deletingId !== null}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canCreate ? (
            <Button onClick={openNewCategory}>
              <Plus className="h-4 w-4" />
              Add category
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

      <div className="panel overflow-hidden rounded-[28px] border border-black/8">
        <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Category list
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {filteredServiceCategories.length} of{" "}
                {serviceCategories.length} categories shown
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-sm">
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            Loading categories...
          </div>
        ) : null}

        {!isLoading && filteredServiceCategories.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
            No categories matched the current search.
          </div>
        ) : null}

        {!isLoading && filteredServiceCategories.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Services</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {filteredServiceCategories.map((serviceCategory) => (
                    <tr key={serviceCategory.id} className="bg-white/55">
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          className="font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                          onClick={() => openCategory(serviceCategory)}
                        >
                          {serviceCategory.name}
                        </button>
                      </td>
                      <td className="max-w-[460px] px-5 py-4 text-[var(--color-muted)]">
                        {serviceCategory.description ? (
                          <span className="line-clamp-2">
                            {serviceCategory.description}
                          </span>
                        ) : (
                          "Unset"
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[var(--color-ink)]">
                        {serviceCategory.serviceCount}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCategory(serviceCategory)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={deletingId === serviceCategory.id}
                              onClick={() =>
                                void handleDelete(serviceCategory)
                              }
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
              {filteredServiceCategories.map((serviceCategory) => (
                <article key={serviceCategory.id} className="bg-white/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        className="text-left font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-gold-deep)] hover:underline"
                        onClick={() => openCategory(serviceCategory)}
                      >
                        {serviceCategory.name}
                      </button>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-gold-deep)]">
                        {serviceCategory.serviceCount} services
                      </p>
                    </div>
                  </div>
                  {serviceCategory.description ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {serviceCategory.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {canUpdate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCategory(serviceCategory)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === serviceCategory.id}
                        onClick={() => void handleDelete(serviceCategory)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
