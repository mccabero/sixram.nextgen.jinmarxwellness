using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Interfaces;

public interface IRbacService
{
    Task<IReadOnlyCollection<RoleListItemDto>> GetRolesAsync(CancellationToken cancellationToken = default);
    IReadOnlyCollection<PermissionGroupDto> GetPermissionGroups();
    Task<RolePermissionEditorDto?> GetRolePermissionEditorAsync(int roleId, CancellationToken cancellationToken = default);
    Task<RolePermissionEditorDto?> UpdateRolePermissionsAsync(int roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default);
}
