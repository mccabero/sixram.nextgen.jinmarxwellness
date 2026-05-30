export interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface RoleListItem {
  id: number;
  name: string;
  description: string;
  permissionCount: number;
  userCount: number;
}

export interface RolePermissionEditor {
  role: RoleListItem;
  selectedPermissionCodes: string[];
  permissionGroups: PermissionGroup[];
}

export interface UpdateRolePermissionsRequest {
  permissionCodes: string[];
}
