import { z } from "zod";
import type {
  SaveServiceCategoryRequest,
  ServiceCategory,
} from "@/types/serviceCategory";

export const emptyServiceCategoryFormValues = {
  name: "",
  description: "",
};

export const serviceCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(100),
  description: z.string().max(500).optional(),
});

export type ServiceCategoryFormValues = z.infer<typeof serviceCategorySchema>;

export function sortServiceCategories(items: ServiceCategory[]) {
  return [...items].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function toFormValues(
  serviceCategory: ServiceCategory,
): ServiceCategoryFormValues {
  return {
    name: serviceCategory.name,
    description: serviceCategory.description ?? "",
  };
}

export function toRequest(
  values: ServiceCategoryFormValues,
): SaveServiceCategoryRequest {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || null,
  };
}
