namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

public class PermissionGroupDto
{
    public string Module { get; init; } = string.Empty;
    public IReadOnlyCollection<PermissionDto> Permissions { get; init; } = [];
}
