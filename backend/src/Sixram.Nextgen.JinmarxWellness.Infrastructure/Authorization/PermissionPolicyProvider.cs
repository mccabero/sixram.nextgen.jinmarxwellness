using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    private const string Prefix = "Permission:";

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        : base(options)
    {
    }

    public static string GetPolicyName(string permissionCode) => $"{Prefix}{permissionCode}";

    public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
        {
            return base.GetPolicyAsync(policyName);
        }

        var permissionCode = policyName[Prefix.Length..];
        var policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new PermissionRequirement(permissionCode))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
