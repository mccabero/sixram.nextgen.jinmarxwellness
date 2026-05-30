using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/rbac")]
public class RbacController : ApiControllerBase
{
    private readonly IRbacService _rbacService;

    public RbacController(IRbacService rbacService)
    {
        _rbacService = rbacService;
    }

    [HttpGet("roles")]
    [RequirePermission(ApplicationPermissions.Rbac.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<RoleListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<RoleListItemDto>>>> GetRoles(
        CancellationToken cancellationToken)
    {
        var roles = await _rbacService.GetRolesAsync(cancellationToken);
        return Success(roles);
    }

    [HttpGet("permissions")]
    [RequirePermission(ApplicationPermissions.Rbac.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PermissionGroupDto>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyCollection<PermissionGroupDto>>> GetPermissions()
    {
        return Success(_rbacService.GetPermissionGroups());
    }

    [HttpGet("roles/{id:int}/permissions")]
    [RequirePermission(ApplicationPermissions.Rbac.View)]
    [ProducesResponseType(typeof(ApiResponse<RolePermissionEditorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<RolePermissionEditorDto>>> GetRolePermissionEditor(
        int id,
        CancellationToken cancellationToken)
    {
        var editor = await _rbacService.GetRolePermissionEditorAsync(id, cancellationToken);

        if (editor is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Role was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(editor);
    }

    [HttpPut("roles/{id:int}/permissions")]
    [RequirePermission(ApplicationPermissions.Rbac.Manage)]
    [ProducesResponseType(typeof(ApiResponse<RolePermissionEditorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<RolePermissionEditorDto>>> UpdateRolePermissions(
        int id,
        [FromBody] UpdateRolePermissionsRequest request,
        CancellationToken cancellationToken)
    {
        var editor = await _rbacService.UpdateRolePermissionsAsync(id, request, cancellationToken);

        if (editor is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Role was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(editor, "Role permissions updated successfully.");
    }
}
