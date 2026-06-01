/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Hash,
  Mail,
  NotebookPen,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { customerService } from "@/services/customerService";
import type { Customer } from "@/types/customer";
import {
  customerSchema,
  emptyCustomerFormValues,
  numberOrZero,
  toFormValues,
  toRequest,
  type CustomerFormValues,
} from "./customerPageUtils";

type ManageCustomerPageClientProps = {
  customerId?: string;
};

const customerListPath = "/customers";

export function ManageCustomerPageClient({
  customerId,
}: ManageCustomerPageClientProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const routeCustomerId = customerId ?? params.id;
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canManage = isAdmin || permissions.includes("customers.manage");
  const isEditMode = Boolean(routeCustomerId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyCustomerFormValues,
  });

  const loadCustomer = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!routeCustomerId) {
        setCustomer(null);
        reset(emptyCustomerFormValues);
        return;
      }

      const response = await customerService.getById(routeCustomerId);
      setCustomer(response);
      reset(toFormValues(response));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load customer."));
    } finally {
      setIsLoading(false);
    }
  }, [reset, routeCustomerId]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  async function submit(values: CustomerFormValues) {
    if (!canManage) {
      setError("You do not have permission to save customers.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (customer) {
        await customerService.update(customer.id, toRequest(values));
        router.replace(customerListPath);
        return;
      }

      await customerService.create(toRequest(values));
      router.replace(customerListPath);
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
            {isEditMode ? "Manage Customer" : "Add Customer"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {isEditMode
              ? "Update contact details, visit history, notes, and status."
              : "Create a customer record for front desk and appointment workflows."}
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push(customerListPath)}>
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Button>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="panel rounded-[28px] border border-black/8 p-6 text-sm text-[var(--color-muted)]">
          Loading customer...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex items-start gap-4 border-b border-black/6 bg-white/55 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {customer ? customer.name : "New customer"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {canManage
                  ? "Keep customer details accurate for bookings and follow-up."
                  : "You can review this page, but saving changes requires customer management access."}
              </p>
            </div>
          </div>

          <form className="space-y-5 p-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-5 xl:grid-cols-2">
              <Input
                label="Customer Name"
                required
                icon={<UserRound className="h-4 w-4" />}
                error={errors.name?.message}
                disabled={!canManage || isSubmitting}
                {...register("name")}
              />
              <Input
                label="Phone Number"
                required
                icon={<Phone className="h-4 w-4" />}
                error={errors.phoneNumber?.message}
                disabled={!canManage || isSubmitting}
                {...register("phoneNumber")}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <Input
                label="Email"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                disabled={!canManage || isSubmitting}
                {...register("email")}
              />
              <Input
                label="Visit Count"
                type="number"
                min="0"
                step="1"
                icon={<Hash className="h-4 w-4" />}
                error={errors.visitCount?.message}
                disabled={!canManage || isSubmitting}
                {...register("visitCount", { setValueAs: numberOrZero })}
              />
              <Input
                label="Last Visit"
                type="date"
                icon={<CalendarClock className="h-4 w-4" />}
                error={errors.lastVisitAt?.message}
                disabled={!canManage || isSubmitting}
                {...register("lastVisitAt")}
              />
            </div>

            <Textarea
              label="Notes"
              rows={5}
              icon={<NotebookPen className="h-4 w-4" />}
              error={errors.notes?.message}
              disabled={!canManage || isSubmitting}
              {...register("notes")}
            />

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
                  <span className="font-medium">Active</span>
                  <Switch
                    checked={field.value}
                    disabled={!canManage || isSubmitting}
                    aria-label="Active"
                    onBlur={field.onBlur}
                    onCheckedChange={field.onChange}
                  />
                </label>
              )}
            />

            <div className="grid gap-3 border-t border-black/8 pt-5 sm:flex sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push(customerListPath)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {canManage ? (
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {customer ? "Save customer" : "Create customer"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
