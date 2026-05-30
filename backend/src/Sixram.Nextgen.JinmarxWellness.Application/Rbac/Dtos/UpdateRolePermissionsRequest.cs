namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

public class UpdateRolePermissionsRequest
{
    public IReadOnlyCollection<string> PermissionCodes { get; init; } = [];
}
