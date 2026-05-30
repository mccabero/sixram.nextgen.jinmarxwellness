/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  Clock3,
  Plus,
  Save,
  Sparkles,
  Tag,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { serviceCategoryService } from "@/services/serviceCategoryService";
import { serviceOfferingService } from "@/services/serviceOfferingService";
import type { ServiceCategory } from "@/types/serviceCategory";
import type { ServiceOffering } from "@/types/serviceOffering";
import {
  emptyServiceOfferingFormValues,
  numberOrNull,
  serviceOfferingSchema,
  toFormValues,
  toRequest,
  type ServiceOfferingFormValues,
} from "./serviceOfferingPageUtils";

type ManageServiceOfferedPageClientProps = {
  serviceId?: string;
};

const serviceOfferedListPath = "/configuration/service-offered";
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrencyFieldValue(value?: number | null) {
  return typeof value === "number" ? currencyFormatter.format(value) : "";
}

function formatCurrencyInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");

  if (!sanitized) {
    return "";
  }

  const [rawWholePart, ...decimalParts] = sanitized.split(".");
  const hasDecimal = sanitized.includes(".");
  const wholePart = rawWholePart.replace(/^0+(?=\d)/, "");
  const formattedWhole = wholePart
    ? Number(wholePart).toLocaleString("en-PH")
    : hasDecimal
      ? "0"
      : "";
  const decimalPart = decimalParts.join("").slice(0, 2);

  return hasDecimal ? `${formattedWhole}.${decimalPart}` : formattedWhole;
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function CurrencyInput({
  label,
  value,
  error,
  disabled,
  onBlur,
  onChange,
}: {
  label: string;
  value?: number | null;
  error?: string;
  disabled: boolean;
  onBlur: () => void;
  onChange: (value: number | null) => void;
}) {
  const [displayValue, setDisplayValue] = useState(formatCurrencyFieldValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrencyFieldValue(value));
    }
  }, [isFocused, value]);

  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      icon={<CircleDollarSign className="h-4 w-4" />}
      rightAdornment={
        <span className="text-xs font-semibold text-[var(--color-muted)]">
          PHP
        </span>
      }
      value={displayValue}
      error={error}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onChange={(event) => {
        const nextValue = formatCurrencyInput(event.target.value);
        setDisplayValue(nextValue);
        onChange(parseCurrencyInput(nextValue));
      }}
      onBlur={() => {
        setIsFocused(false);
        setDisplayValue(formatCurrencyFieldValue(parseCurrencyInput(displayValue)));
        onBlur();
      }}
    />
  );
}

export function ManageServiceOfferedPageClient({
  serviceId,
}: ManageServiceOfferedPageClientProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeServiceId = serviceId ?? params.id;
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const isEditMode = Boolean(routeServiceId);
  const canCreate = isAdmin || permissions.includes("service_offerings.create");
  const canUpdate = isAdmin || permissions.includes("service_offerings.update");
  const canSave = isEditMode ? canUpdate : canCreate;
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [serviceOffering, setServiceOffering] = useState<ServiceOffering | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceOfferingFormValues>({
    resolver: zodResolver(serviceOfferingSchema),
    defaultValues: emptyServiceOfferingFormValues,
  });

  const loadServiceOffering = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const allCategories = await serviceCategoryService.getAll();
      setServiceCategories(allCategories);

      if (!routeServiceId) {
        setServiceOffering(null);
        reset({
          ...emptyServiceOfferingFormValues,
          serviceCategoryId: allCategories[0]?.id ?? 0,
        });
        return;
      }

      const response = await serviceOfferingService.getById(routeServiceId);
      setServiceOffering(response);
      reset(toFormValues(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load service offering."));
    } finally {
      setIsLoading(false);
    }
  }, [reset, routeServiceId]);

  useEffect(() => {
    void loadServiceOffering();
  }, [loadServiceOffering]);

  async function submit(values: ServiceOfferingFormValues) {
    if (!canSave) {
      setError("You do not have permission to save service offerings.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (serviceOffering) {
        await serviceOfferingService.update(
          serviceOffering.id,
          toRequest(values),
        );
        router.replace(serviceOfferedListPath);
        return;
      }

      await serviceOfferingService.create(toRequest(values));
      router.replace(serviceOfferedListPath);
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
            Configuration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            {isEditMode ? "Manage Service" : "Add Service"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update pricing, duration, tags, and availability for this service."
              : "Create a service row for the massage menu."}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(serviceOfferedListPath)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading service...
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
                {serviceOffering ? serviceOffering.name : "New service"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {canSave
                  ? "Keep service information clear for front desk checkout and bookings."
                  : "You can review this page, but saving changes requires service management access."}
              </p>
            </div>
          </div>

          <form className="space-y-5 p-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-5 xl:grid-cols-2">
              <Input
                label="Service Name"
                required
                icon={<Sparkles className="h-4 w-4" />}
                error={errors.name?.message}
                disabled={!canSave || isSubmitting}
                {...register("name")}
              />

              <Select
                label="Category"
                required
                icon={<Tag className="h-4 w-4" />}
                error={errors.serviceCategoryId?.message}
                disabled={!canSave || isSubmitting}
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found."
                options={[
                  { label: "Select category", value: "0" },
                  ...serviceCategories.map((serviceCategory) => ({
                    label: serviceCategory.name,
                    value: String(serviceCategory.id),
                  })),
                ]}
                {...register("serviceCategoryId", {
                  setValueAs: (value) => Number(value) || 0,
                })}
              />
            </div>

            <Textarea
              label="Description"
              rows={3}
              error={errors.description?.message}
              disabled={!canSave || isSubmitting}
              {...register("description")}
            />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Duration"
                type="number"
                min="1"
                step="1"
                icon={<Clock3 className="h-4 w-4" />}
                rightAdornment={
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    min
                  </span>
                }
                error={errors.durationMinutes?.message}
                disabled={!canSave || isSubmitting}
                {...register("durationMinutes", { setValueAs: numberOrNull })}
              />
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <CurrencyInput
                    label="Price"
                    value={field.value}
                    error={errors.price?.message}
                    disabled={!canSave || isSubmitting}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Input
                label="Add-on Details"
                icon={<Plus className="h-4 w-4" />}
                error={errors.addOnDetails?.message}
                disabled={!canSave || isSubmitting}
                {...register("addOnDetails")}
              />
              <Controller
                control={control}
                name="addOnRate"
                render={({ field }) => (
                  <CurrencyInput
                    label="Add-on Rate"
                    value={field.value}
                    error={errors.addOnRate?.message}
                    disabled={!canSave || isSubmitting}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="isHomeService"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
                    <span className="font-medium">Home service</span>
                    <Switch
                      checked={field.value}
                      disabled={!canSave || isSubmitting}
                      aria-label="Home service"
                      onBlur={field.onBlur}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
                    <span className="font-medium">Active</span>
                    <Switch
                      checked={field.value}
                      disabled={!canSave || isSubmitting}
                      aria-label="Active"
                      onBlur={field.onBlur}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />
            </div>

            <div className="grid gap-3 border-t border-black/8 pt-5 sm:flex sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push(serviceOfferedListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canSave ? (
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {serviceOffering ? "Save service" : "Create service"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
