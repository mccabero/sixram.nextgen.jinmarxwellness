using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class RbacService : IRbacService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _dbContext;

    public RbacService(RoleManager<ApplicationRole> roleManager, ApplicationDbContext dbContext)
    {
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<RoleListItemDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _roleManager.Roles
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        var result = new List<RoleListItemDto>();
        foreach (var role in roles)
        {
            result.Add(await ToRoleListItemAsync(role, cancellationToken));
        }

        return result;
    }

    public IReadOnlyCollection<PermissionGroupDto> GetPermissionGroups() => BuildPermissionGroups();

    public async Task<RolePermissionEditorDto?> GetRolePermissionEditorAsync(
        int roleId,
        CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.Roles
            .FirstOrDefaultAsync(item => item.Id == roleId, cancellationToken);

        if (role is null)
        {
            return null;
        }

        return await BuildEditorAsync(role, cancellationToken);
    }

    public async Task<RolePermissionEditorDto?> UpdateRolePermissionsAsync(
        int roleId,
        UpdateRolePermissionsRequest request,
        CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.Roles
            .FirstOrDefaultAsync(item => item.Id == roleId, cancellationToken);

        if (role is null)
        {
            return null;
        }

        var allowedCodes = ApplicationPermissions.All
            .Select(permission => permission.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var requestedCodes = request.PermissionCodes
            .Where(code => allowedCodes.Contains(code))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var currentPermissionClaims = (await _roleManager.GetClaimsAsync(role))
            .Where(IsPermissionClaim)
            .ToArray();
        var currentCodes = currentPermissionClaims
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var claim in currentPermissionClaims.Where(claim => !requestedCodes.Contains(claim.Value, StringComparer.OrdinalIgnoreCase)))
        {
            var removeResult = await _roleManager.RemoveClaimAsync(role, claim);
            ThrowIfFailed(removeResult, "Unable to remove role permission.");
        }

        foreach (var code in requestedCodes.Where(code => !currentCodes.Contains(code)))
        {
            var addResult = await _roleManager.AddClaimAsync(
                role,
                new Claim(ApplicationClaimTypes.Permission, code));
            ThrowIfFailed(addResult, "Unable to add role permission.");
        }

        return await BuildEditorAsync(role, cancellationToken);
    }

    private async Task<RolePermissionEditorDto> BuildEditorAsync(
        ApplicationRole role,
        CancellationToken cancellationToken)
    {
        var claims = await _roleManager.GetClaimsAsync(role);
        var selectedPermissionCodes = claims
            .Where(IsPermissionClaim)
            .Select(claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(code => code)
            .ToArray();

        return new RolePermissionEditorDto
        {
            Role = await ToRoleListItemAsync(role, cancellationToken),
            SelectedPermissionCodes = selectedPermissionCodes,
            PermissionGroups = BuildPermissionGroups()
        };
    }

    private async Task<RoleListItemDto> ToRoleListItemAsync(
        ApplicationRole role,
        CancellationToken cancellationToken)
    {
        var claims = await _roleManager.GetClaimsAsync(role);
        var userCount = await _dbContext.UserRoles
            .CountAsync(userRole => userRole.RoleId == role.Id, cancellationToken);

        return new RoleListItemDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            Description = role.Description ?? string.Empty,
            PermissionCount = claims.Count(IsPermissionClaim),
            UserCount = userCount
        };
    }

    private static IReadOnlyCollection<PermissionGroupDto> BuildPermissionGroups()
    {
        return ApplicationPermissions.All
            .GroupBy(permission => permission.Module)
            .OrderBy(group => group.Key)
            .Select(group => new PermissionGroupDto
            {
                Module = group.Key,
                Permissions = group
                    .OrderBy(permission => permission.Code)
                    .Select(permission => new PermissionDto
                    {
                        Code = permission.Code,
                        Name = permission.Name,
                        Description = permission.Description,
                        Module = permission.Module
                    })
                    .ToArray()
            })
            .ToArray();
    }

    private static bool IsPermissionClaim(Claim claim) =>
        claim.Type == ApplicationClaimTypes.Permission;

    private static void ThrowIfFailed(IdentityResult result, string message)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(" ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"{message} {errors}");
    }
}
