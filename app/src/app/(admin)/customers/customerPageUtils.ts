import { z } from "zod";
import type { Customer, SaveCustomerRequest } from "@/types/customer";

export const emptyCustomerFormValues = {
  name: "",
  phoneNumber: "",
  email: "",
  notes: "",
  visitCount: 0,
  lastVisitAt: "",
  isActive: true,
};

const optionalEmailSchema = z
  .string()
  .trim()
  .max(256)
  .refine(
    (value) => value.length === 0 || z.email().safeParse(value).success,
    "Enter a valid email address.",
  );

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required.").max(150),
  phoneNumber: z.string().trim().min(1, "Phone number is required.").max(50),
  email: optionalEmailSchema,
  notes: z.string().max(1000).optional(),
  visitCount: z
    .number()
    .int("Visit count must be a whole number.")
    .min(0, "Visit count must not be negative."),
  lastVisitAt: z.string().optional(),
  isActive: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type StatusFilter = "all" | "active" | "inactive";

export function numberOrZero(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortCustomers(items: Customer[]) {
  return [...items].sort((first, second) => {
    const nameSort = first.name.localeCompare(second.name);
    return nameSort === 0
      ? first.phoneNumber.localeCompare(second.phoneNumber)
      : nameSort;
  });
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "No visit yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No visit yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function toFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    phoneNumber: customer.phoneNumber,
    email: customer.email ?? "",
    notes: customer.notes ?? "",
    visitCount: customer.visitCount ?? 0,
    lastVisitAt: toDateInputValue(customer.lastVisitAt),
    isActive: customer.isActive,
  };
}

export function toRequest(values: CustomerFormValues): SaveCustomerRequest {
  return {
    name: values.name.trim(),
    phoneNumber: values.phoneNumber.trim(),
    email: values.email.trim() || null,
    notes: values.notes?.trim() || null,
    visitCount: values.visitCount,
    lastVisitAt: values.lastVisitAt
      ? `${values.lastVisitAt}T00:00:00+08:00`
      : null,
    isActive: values.isActive,
  };
}
