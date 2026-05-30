/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { serviceCategoryService } from "@/services/serviceCategoryService";
import type { ServiceCategory } from "@/types/serviceCategory";
import {
  emptyServiceCategoryFormValues,
  serviceCategorySchema,
  toFormValues,
  toRequest,
  type ServiceCategoryFormValues,
} from "./serviceCategoryPageUtils";

type ManageServiceCategoryPageClientProps = {
  serviceCategoryId?: string;
};

const serviceCategoriesListPath = "/configuration/service-categories";

export function ManageServiceCategoryPageClient({
  serviceCategoryId,
}: ManageServiceCategoryPageClientProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeServiceCategoryId = serviceCategoryId ?? params.id;
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const isEditMode = Boolean(routeServiceCategoryId);
  const canCreate = isAdmin || permissions.includes("service_categories.create");
  const canUpdate = isAdmin || permissions.includes("service_categories.update");
  const canSave = isEditMode ? canUpdate : canCreate;
  const [serviceCategory, setServiceCategory] =
    useState<ServiceCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: emptyServiceCategoryFormValues,
  });

  const loadServiceCategory = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!routeServiceCategoryId) {
        setServiceCategory(null);
        reset(emptyServiceCategoryFormValues);
        return;
      }

      const response =
        await serviceCategoryService.getById(routeServiceCategoryId);
      setServiceCategory(response);
      reset(toFormValues(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load service category."));
    } finally {
      setIsLoading(false);
    }
  }, [reset, routeServiceCategoryId]);

  useEffect(() => {
    void loadServiceCategory();
  }, [loadServiceCategory]);

  async function submit(values: ServiceCategoryFormValues) {
    if (!canSave) {
      setError("You do not have permission to save service categories.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (serviceCategory) {
        await serviceCategoryService.update(
          serviceCategory.id,
          toRequest(values),
        );
        router.replace(serviceCategoriesListPath);
        return;
      }

      await serviceCategoryService.create(toRequest(values));
      router.replace(serviceCategoriesListPath);
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, "Please review the form and try again."),
      );
    } finally {
      setIsSubmitting(false);
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
            {isEditMode ? "Manage Service Category" : "Add Service Category"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update category naming and description used by service offerings."
              : "Create a category for grouping service offerings."}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(serviceCategoriesListPath)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading category...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {serviceCategory ? serviceCategory.name : "New category"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {canSave
                  ? "Keep category labels clear for service organization."
                  : "You can review this page, but saving changes requires category management access."}
              </p>
            </div>
          </div>

          <form className="space-y-5 p-5" onSubmit={handleSubmit(submit)}>
            <Input
              label="Name"
              required
              icon={<Tag className="h-4 w-4" />}
              error={errors.name?.message}
              disabled={!canSave || isSubmitting}
              {...register("name")}
            />

            <Textarea
              label="Description"
              rows={4}
              error={errors.description?.message}
              disabled={!canSave || isSubmitting}
              {...register("description")}
            />

            <div className="grid gap-3 border-t border-black/8 pt-5 sm:flex sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push(serviceCategoriesListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canSave ? (
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {serviceCategory ? "Save category" : "Create category"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
