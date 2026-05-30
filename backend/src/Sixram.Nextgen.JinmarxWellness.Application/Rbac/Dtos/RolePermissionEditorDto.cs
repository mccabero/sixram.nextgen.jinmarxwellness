namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

public class RolePermissionEditorDto
{
    public RoleListItemDto Role { get; init; } = new();
    public IReadOnlyCollection<string> SelectedPermissionCodes { get; init; } = [];
    public IReadOnlyCollection<PermissionGroupDto> PermissionGroups { get; init; } = [];
}
