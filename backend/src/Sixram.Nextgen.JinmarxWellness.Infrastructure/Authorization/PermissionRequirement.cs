using Microsoft.AspNetCore.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionRequirement(string permissionCode)
    {
        PermissionCode = permissionCode;
    }

    public string PermissionCode { get; }
}
