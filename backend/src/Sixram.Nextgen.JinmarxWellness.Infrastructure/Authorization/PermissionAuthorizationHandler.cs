using Microsoft.AspNetCore.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var isAdmin = context.User.IsInRole("Admin");
        var hasPermission = context.User.Claims.Any(claim =>
            claim.Type == ApplicationClaimTypes.Permission &&
            string.Equals(claim.Value, requirement.PermissionCode, StringComparison.OrdinalIgnoreCase));

        if (isAdmin || hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
