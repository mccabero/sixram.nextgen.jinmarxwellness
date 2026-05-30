using Microsoft.AspNetCore.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permissionCode)
    {
        Policy = PermissionPolicyProvider.GetPolicyName(permissionCode);
    }
}
