import { z } from "zod";
import type {
  CreateUserInformationRequest,
  SaveUserInformationRequest,
  UserInformation,
} from "@/types/userInformation";

export const primaryRoleOptions = [
  { label: "Admin", value: "Admin" },
  { label: "Staff", value: "Staff" },
  { label: "Therapist", value: "Therapist" },
];

const userInformationBaseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().min(1, "Email address is required.").email(),
  phoneNumber: z.string().max(50).optional(),
  username: z.string().trim().min(1, "Username is required.").max(256),
  role: z.string().trim().min(1, "Role is required."),
  isTherapist: z.boolean(),
  isActive: z.boolean(),
});

export const userInformationSchema = userInformationBaseSchema.extend({
  password: z.string().optional(),
  pin: z.string().optional(),
});

export const createUserInformationSchema = userInformationBaseSchema.extend({
  password: z
    .string()
    .min(1, "Temporary password is required.")
    .min(8, "Temporary password must be at least 8 characters.")
    .regex(/[A-Z]/, "Temporary password must include an uppercase letter.")
    .regex(/[a-z]/, "Temporary password must include a lowercase letter.")
    .regex(/[0-9]/, "Temporary password must include a number."),
  pin: z
    .string()
    .regex(/^\d{6}$/, "PIN must be 6 digits.")
    .optional()
    .or(z.literal("")),
});

export type UserInformationFormValues = z.infer<typeof userInformationSchema>;

export const emptyUserInformationFormValues: UserInformationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  username: "",
  role: "Staff",
  isTherapist: false,
  isActive: true,
  password: "",
  pin: "",
};

export function getUserFullName(user: UserInformation) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

export function getUserRoleLabel(user: UserInformation) {
  return user.role || user.roles[0] || "Unassigned";
}

export function toFormValues(
  user: UserInformation,
): UserInformationFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? "",
    username: user.username,
    role: user.role || "Staff",
    isTherapist: user.isTherapist,
    isActive: user.isActive,
    password: "",
    pin: "",
  };
}

export function toRequest(
  values: UserInformationFormValues,
): SaveUserInformationRequest {
  const role = values.role.trim();

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phoneNumber: values.phoneNumber?.trim() || null,
    username: values.username.trim(),
    role,
    isTherapist: values.isTherapist || role === "Therapist",
    isActive: values.isActive,
  };
}

export function toCreateRequest(
  values: UserInformationFormValues,
): CreateUserInformationRequest {
  return {
    ...toRequest(values),
    password: values.password?.trim() ?? "",
    pin: values.pin?.trim() || null,
  };
}
