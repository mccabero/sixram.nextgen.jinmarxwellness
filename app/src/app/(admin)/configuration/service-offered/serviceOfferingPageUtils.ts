import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import type {
  SaveServiceOfferingRequest,
  ServiceOffering,
} from "@/types/serviceOffering";
import type { ServiceCategory } from "@/types/serviceCategory";

export const emptyServiceOfferingFormValues = {
  name: "",
  serviceCategoryId: 0,
  description: "",
  durationMinutes: null,
  price: null,
  addOnDetails: "",
  addOnRate: null,
  isHomeService: false,
  isActive: true,
};

export const serviceOfferingSchema = z.object({
  name: z.string().trim().min(1, "Service name is required.").max(150),
  serviceCategoryId: z
    .number()
    .int("Category is required.")
    .positive("Category is required."),
  description: z.string().max(500).optional(),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number.")
    .positive("Duration must be greater than zero.")
    .nullable(),
  price: z.number().min(0, "Price must not be negative.").nullable(),
  addOnDetails: z.string().max(250).optional(),
  addOnRate: z.number().min(0, "Add-on rate must not be negative.").nullable(),
  isHomeService: z.boolean(),
  isActive: z.boolean(),
});

export type ServiceOfferingFormValues = z.infer<typeof serviceOfferingSchema>;
export type StatusFilter = "all" | "active" | "inactive";

export function numberOrNull(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function sortServiceOfferings(items: ServiceOffering[]) {
  return [...items].sort((first, second) => {
    const categorySort = first.category.localeCompare(second.category);
    return categorySort === 0
      ? first.name.localeCompare(second.name)
      : categorySort;
  });
}

export function getServiceOfferingCategories(
  items: ServiceOffering[],
  serviceCategories: ServiceCategory[] = [],
) {
  return Array.from(
    new Set([
      ...serviceCategories.map((serviceCategory) => serviceCategory.name),
      ...items.map((serviceOffering) => serviceOffering.category),
    ].filter(Boolean)),
  ).sort((first, second) => {
    return first.localeCompare(second);
  });
}

export function formatDuration(minutes?: number | null) {
  if (!minutes) {
    return "Unset";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

export function formatPrice(price?: number | null) {
  return typeof price === "number" ? formatCurrency(price) : "Unset";
}

export function toFormValues(
  serviceOffering: ServiceOffering,
): ServiceOfferingFormValues {
  return {
    name: serviceOffering.name,
    serviceCategoryId: serviceOffering.serviceCategoryId,
    description: serviceOffering.description ?? "",
    durationMinutes: serviceOffering.durationMinutes ?? null,
    price: serviceOffering.price ?? null,
    addOnDetails: serviceOffering.addOnDetails ?? "",
    addOnRate: serviceOffering.addOnRate ?? null,
    isHomeService: serviceOffering.isHomeService,
    isActive: serviceOffering.isActive,
  };
}

export function toRequest(
  values: ServiceOfferingFormValues,
): SaveServiceOfferingRequest {
  return {
    name: values.name,
    serviceCategoryId: values.serviceCategoryId,
    description: values.description?.trim() || null,
    durationMinutes: values.durationMinutes,
    price: values.price,
    addOnDetails: values.addOnDetails?.trim() || null,
    addOnRate: values.addOnRate,
    isHomeService: values.isHomeService,
    isActive: values.isActive,
  };
}
