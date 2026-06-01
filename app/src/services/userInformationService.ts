import { apiClient } from "@/lib/api";
import type {
  CreateUserInformationRequest,
  SaveUserInformationRequest,
  UserInformation,
} from "@/types/userInformation";

function normalizeUserInformation(user: UserInformation): UserInformation {
  return {
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? null,
    username: user.username ?? "",
    role: user.role ?? "",
    roles: user.roles ?? [],
    isTherapist: Boolean(user.isTherapist),
    isActive: Boolean(user.isActive),
    hasPinConfigured: Boolean(user.hasPinConfigured),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

function normalizeList(users: UserInformation[]) {
  return users.map(normalizeUserInformation);
}

export const userInformationService = {
  async getAll() {
    const users = await apiClient.get<UserInformation[]>("/api/users");
    return normalizeList(users);
  },
  async getById(id: number | string) {
    const user = await apiClient.get<UserInformation>(`/api/users/${id}`);
    return normalizeUserInformation(user);
  },
  async create(payload: CreateUserInformationRequest) {
    const user = await apiClient.post<UserInformation>("/api/users", payload);
    return normalizeUserInformation(user);
  },
  async update(id: number, payload: SaveUserInformationRequest) {
    const user = await apiClient.put<UserInformation>(`/api/users/${id}`, payload);
    return normalizeUserInformation(user);
  },
};
