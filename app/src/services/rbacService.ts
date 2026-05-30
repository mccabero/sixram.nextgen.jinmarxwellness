import { apiClient } from "@/lib/api";
import type {
  RoleListItem,
  RolePermissionEditor,
  UpdateRolePermissionsRequest,
} from "@/types/rbac";

export const rbacService = {
  getRoles() {
    return apiClient.get<RoleListItem[]>("/api/rbac/roles");
  },
  getRolePermissionEditor(roleId: number | string) {
    return apiClient.get<RolePermissionEditor>(
      `/api/rbac/roles/${roleId}/permissions`,
    );
  },
  updateRolePermissions(
    roleId: number | string,
    payload: UpdateRolePermissionsRequest,
  ) {
    return apiClient.put<RolePermissionEditor>(
      `/api/rbac/roles/${roleId}/permissions`,
      payload,
    );
  },
};
