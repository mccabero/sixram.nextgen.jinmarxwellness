"use client";

import { useEffect } from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  MapPin,
  Plus,
  Trash2,
  Type,
  UserRound,
} from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import type {
  CompanyInformation,
  UpdateCompanyInformationRequest,
} from "@/types/companyInformation";

const companyAccountSchema = z.object({
  accountName: z.string().trim().min(1, "Account name is required."),
  accountNumber: z.string().trim().min(1, "Account number is required."),
  isPrimary: z.boolean(),
});

const bankAccountSchema = z.object({
  bankProvider: z.string().trim().min(1, "Bank provider is required."),
  accountName: z.string().trim().min(1, "Account name is required."),
  accountNumber: z.string().trim().min(1, "Account number is required."),
  isPrimary: z.boolean(),
});

const companyInformationSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required."),
    tagline: z.string().max(200, "Tagline must not exceed 200 characters.").optional(),
    companyAddress: z.string().optional(),
    gcashNumbers: z.array(companyAccountSchema),
    bankAccounts: z.array(bankAccountSchema),
  })
  .superRefine((value, context) => {
    validateSinglePrimary(value.gcashNumbers, "gcashNumbers", context);
    validateSinglePrimary(value.bankAccounts, "bankAccounts", context);
  });

type CompanyInformationFormValues = z.infer<typeof companyInformationSchema>;

interface CompanyInformationFormProps {
  value?: CompanyInformation | null;
  canUpdate: boolean;
  isSubmitting: boolean;
  formId?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit: (payload: UpdateCompanyInformationRequest) => Promise<void>;
}

function validateSinglePrimary(
  accounts:
    | CompanyInformationFormValues["gcashNumbers"]
    | CompanyInformationFormValues["bankAccounts"],
  path: "gcashNumbers" | "bankAccounts",
  context: z.RefinementCtx,
) {
  if (accounts.length === 0) {
    return;
  }

  if (accounts.filter((account) => account.isPrimary).length !== 1) {
    context.addIssue({
      code: "custom",
      path: [path],
      message: "Exactly one primary account is required when entries exist.",
    });
  }
}

export function CompanyInformationForm({
  value,
  canUpdate,
  isSubmitting,
  formId = "company-information-form",
  cancelLabel = "Cancel",
  onCancel,
  onSubmit,
}: CompanyInformationFormProps) {
  const {
    control,
    register,
    reset,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyInformationFormValues>({
    resolver: zodResolver(companyInformationSchema),
    defaultValues: {
      companyName: "",
      tagline: "",
      companyAddress: "",
      gcashNumbers: [],
      bankAccounts: [],
    },
  });

  const gcashArray = useFieldArray({
    control,
    name: "gcashNumbers",
  });
  const bankArray = useFieldArray({
    control,
    name: "bankAccounts",
  });
  const watchedGcashNumbers = useWatch({ control, name: "gcashNumbers" }) ?? [];
  const watchedBankAccounts = useWatch({ control, name: "bankAccounts" }) ?? [];

  useEffect(() => {
    reset({
      companyName: value?.companyName ?? "",
      tagline: value?.tagline ?? "",
      companyAddress: value?.companyAddress ?? "",
      gcashNumbers:
        value?.gcashNumbers?.map((account) => ({
          accountName: account.accountName ?? "",
          accountNumber: account.accountNumber ?? "",
          isPrimary: Boolean(account.isPrimary),
        })) ?? [],
      bankAccounts:
        value?.bankAccounts?.map((account) => ({
          bankProvider: account.bankProvider ?? "",
          accountName: account.accountName ?? "",
          accountNumber: account.accountNumber ?? "",
          isPrimary: Boolean(account.isPrimary),
        })) ?? [],
    });
  }, [reset, value]);

  function addAccount(type: "gcashNumbers" | "bankAccounts") {
    const current = getValues(type);
    if (type === "gcashNumbers") {
      gcashArray.append({
        accountName: "",
        accountNumber: "",
        isPrimary: current.length === 0,
      });
      return;
    }

    bankArray.append({
      bankProvider: "",
      accountName: "",
      accountNumber: "",
      isPrimary: current.length === 0,
    });
  }

  function removeAccount(type: "gcashNumbers" | "bankAccounts", index: number) {
    if (type === "gcashNumbers") {
      const remaining = getValues("gcashNumbers").filter(
        (_, itemIndex) => itemIndex !== index,
      );
      const normalized = remaining.map((account, itemIndex) => ({
        ...account,
        isPrimary: remaining.some((item) => item.isPrimary)
          ? account.isPrimary
          : itemIndex === 0,
      }));
      gcashArray.replace(normalized);
      return;
    }

    const remaining = getValues("bankAccounts").filter(
      (_, itemIndex) => itemIndex !== index,
    );
    const normalized = remaining.map((account, itemIndex) => ({
      ...account,
      isPrimary: remaining.some((item) => item.isPrimary)
        ? account.isPrimary
        : itemIndex === 0,
    }));
    bankArray.replace(normalized);
  }

  function setPrimary(type: "gcashNumbers" | "bankAccounts", index: number) {
    if (type === "gcashNumbers") {
      setValue(
        "gcashNumbers",
        getValues("gcashNumbers").map((account, itemIndex) => ({
          ...account,
          isPrimary: itemIndex === index,
        })),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      return;
    }

    setValue(
      "bankAccounts",
      getValues("bankAccounts").map((account, itemIndex) => ({
        ...account,
        isPrimary: itemIndex === index,
      })),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  async function submit(values: CompanyInformationFormValues) {
    await onSubmit({
      companyName: values.companyName,
      tagline: values.tagline || null,
      companyAddress: values.companyAddress || null,
      gcashNumbers: values.gcashNumbers,
      bankAccounts: values.bankAccounts,
    });
  }

  function renderAccountSection({
    title,
    description,
    type,
    fields,
    primaryError,
    showBankProvider = false,
  }: {
    title: string;
    description: string;
    type: "gcashNumbers" | "bankAccounts";
    fields: Array<{ id: string }>;
    primaryError?: string;
    showBankProvider?: boolean;
  }) {
    const watchedAccounts =
      type === "gcashNumbers" ? watchedGcashNumbers : watchedBankAccounts;

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {description}
            </p>
          </div>
          {canUpdate ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => addAccount(type)}
            >
              <Plus className="h-4 w-4" />
              Add row
            </Button>
          ) : null}
        </div>

        {fields.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-black/10 bg-white/60 px-5 py-6 text-sm text-[var(--color-muted)]">
            No accounts added yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                "hidden gap-3 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] md:grid",
                showBankProvider
                  ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px_52px]"
                  : "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_52px]",
              )}
            >
              {showBankProvider ? <span>Bank Provider</span> : null}
              <span>Account Name</span>
              <span>Account Number</span>
              <span>Primary</span>
              <span className="text-right">Action</span>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className={cn(
                  "grid gap-3 rounded-[22px] border border-black/8 bg-white/70 p-4 md:items-start",
                  showBankProvider
                    ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px_52px]"
                    : "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_52px]",
                )}
              >
                {showBankProvider && type === "bankAccounts" ? (
                  <Input
                    label={index === 0 ? "Bank provider" : undefined}
                    required
                    icon={<Landmark className="h-4 w-4" />}
                    className="md:[&_label>span]:hidden"
                    error={errors.bankAccounts?.[index]?.bankProvider?.message?.toString()}
                    disabled={!canUpdate || isSubmitting}
                    {...register(`bankAccounts.${index}.bankProvider`)}
                  />
                ) : null}
                <Input
                  label={index === 0 ? "Account name" : undefined}
                  required
                  icon={<UserRound className="h-4 w-4" />}
                  className="md:[&_label>span]:hidden"
                  error={errors[type]?.[index]?.accountName?.message?.toString()}
                  disabled={!canUpdate || isSubmitting}
                  {...register(`${type}.${index}.accountName`)}
                />
                <Input
                  label={index === 0 ? "Account number" : undefined}
                  required
                  icon={<CreditCard className="h-4 w-4" />}
                  className="md:[&_label>span]:hidden"
                  error={errors[type]?.[index]?.accountNumber?.message?.toString()}
                  disabled={!canUpdate || isSubmitting}
                  {...register(`${type}.${index}.accountNumber`)}
                />
                <label className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-ink)] md:mt-[30px]">
                  <input
                    type="radio"
                    name={`${type}-primary`}
                    checked={Boolean(watchedAccounts[index]?.isPrimary)}
                    disabled={!canUpdate || isSubmitting}
                    onChange={() => setPrimary(type, index)}
                    className="h-4 w-4 border-black/20 text-[var(--color-gold)] focus:ring-[rgba(212,175,55,0.18)]"
                  />
                  <span className="font-medium">Primary</span>
                </label>
                <div className="flex items-center justify-end md:mt-[30px]">
                  {canUpdate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 px-0"
                      disabled={isSubmitting}
                      aria-label="Remove account"
                      title="Remove account"
                      onClick={() => removeAccount(type, index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {primaryError ? (
          <p className="text-xs text-rose-600">{primaryError}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form id={formId} className="space-y-8" onSubmit={handleSubmit(submit)}>
      <Input
        label="Company Name"
        required
        icon={<Building2 className="h-4 w-4" />}
        error={errors.companyName?.message}
        disabled={!canUpdate || isSubmitting}
        {...register("companyName")}
      />

      <Input
        label="Tagline"
        icon={<Type className="h-4 w-4" />}
        error={errors.tagline?.message}
        helperText="Optional short brand line shown beneath the company name when needed."
        disabled={!canUpdate || isSubmitting}
        {...register("tagline")}
      />

      <Textarea
        label="Company Address"
        rows={4}
        icon={<MapPin className="h-4 w-4" />}
        error={errors.companyAddress?.message}
        disabled={!canUpdate || isSubmitting}
        {...register("companyAddress")}
      />

      {renderAccountSection({
        title: "GCash Numbers",
        description:
          "Maintain one or more GCash collection accounts and mark the main one as primary.",
        type: "gcashNumbers",
        fields: gcashArray.fields,
        primaryError: errors.gcashNumbers?.message,
      })}

      {renderAccountSection({
        title: "Bank Accounts",
        description:
          "Maintain one or more bank collection accounts and mark the main one as primary.",
        type: "bankAccounts",
        fields: bankArray.fields,
        primaryError: errors.bankAccounts?.message,
        showBankProvider: true,
      })}

      <div
        className={cn(
          "grid gap-3 border-t border-black/8 pt-5 sm:flex sm:justify-end",
          !canUpdate && !onCancel && "hidden",
        )}
      >
        {onCancel ? (
          <Button
            variant="ghost"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        ) : null}
        {canUpdate ? (
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Save company information
          </Button>
        ) : null}
      </div>
    </form>
  );
}
