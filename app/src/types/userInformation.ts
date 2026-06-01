export interface UserInformation {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  username: string;
  role: string;
  roles: string[];
  isTherapist: boolean;
  isActive: boolean;
  hasPinConfigured: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface SaveUserInformationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  username: string;
  role: string;
  isTherapist: boolean;
  isActive: boolean;
}

export interface CreateUserInformationRequest extends SaveUserInformationRequest {
  password: string;
  pin?: string | null;
}
