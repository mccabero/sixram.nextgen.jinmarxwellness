namespace Sixram.Nextgen.JinmarxWellness.Application.Authorization;

public sealed record PermissionDefinition(
    string Code,
    string Name,
    string Description,
    string Module);
