export type UserRole = "Admin" | "Staff" | "Therapist";

export interface PermissionClaim {
  code: string;
  name: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  permissions: PermissionClaim[];
}

export interface LoginRequest {
  loginMode: "pin" | "password";
  username?: string;
  password?: string;
  pin?: string;
}

export interface AuthResponse {
  user: CurrentUser;
}
