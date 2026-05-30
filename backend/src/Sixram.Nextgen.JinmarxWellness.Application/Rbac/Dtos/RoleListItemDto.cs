namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

public class RoleListItemDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int PermissionCount { get; init; }
    public int UserCount { get; init; }
}
