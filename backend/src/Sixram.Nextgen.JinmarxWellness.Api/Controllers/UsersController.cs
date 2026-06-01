using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserInformationService _userInformationService;

    public UsersController(IUserInformationService userInformationService)
    {
        _userInformationService = userInformationService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<UserInformationDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<UserInformationDto>>>> GetUsers(
        CancellationToken cancellationToken)
    {
        var users = await _userInformationService.GetAllAsync(cancellationToken);
        return Success(users);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<UserInformationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserInformationDto>>> GetUser(
        int id,
        CancellationToken cancellationToken)
    {
        var user = await _userInformationService.GetByIdAsync(id, cancellationToken);

        if (user is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "User was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(user);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.Users.Create)]
    [ProducesResponseType(typeof(ApiResponse<UserInformationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<UserInformationDto>>> CreateUser(
        [FromBody] CreateUserInformationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userInformationService.CreateAsync(request, cancellationToken);

        return result.Status switch
        {
            UserInformationMutationStatus.Success =>
                CreatedAtAction(
                    nameof(GetUser),
                    new { id = result.User!.Id },
                    ApiResponse.Success(
                        result.User,
                        "User created successfully.",
                        HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.DuplicateUserName =>
                Conflict(ApiResponse.Error<object>(
                    "A user with this username already exists.",
                    traceId: HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.DuplicateEmail =>
                Conflict(ApiResponse.Error<object>(
                    "A user with this email address already exists.",
                    traceId: HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.RoleNotFound =>
                BadRequest(ApiResponse.ValidationError(
                    ["Selected role was not found."],
                    HttpContext.TraceIdentifier)),
            _ =>
                BadRequest(ApiResponse.ValidationError(
                    result.Errors.Count > 0
                        ? result.Errors
                        : ["Unable to create user."],
                    HttpContext.TraceIdentifier))
        };
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.Users.Update)]
    [ProducesResponseType(typeof(ApiResponse<UserInformationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<UserInformationDto>>> UpdateUser(
        int id,
        [FromBody] UpdateUserInformationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userInformationService.UpdateAsync(id, request, cancellationToken);

        return result.Status switch
        {
            UserInformationMutationStatus.Success =>
                Success(result.User!, "User information updated successfully."),
            UserInformationMutationStatus.UserNotFound =>
                NotFound(ApiResponse.Error<object>(
                    "User was not found.",
                    traceId: HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.DuplicateUserName =>
                Conflict(ApiResponse.Error<object>(
                    "A user with this username already exists.",
                    traceId: HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.DuplicateEmail =>
                Conflict(ApiResponse.Error<object>(
                    "A user with this email address already exists.",
                    traceId: HttpContext.TraceIdentifier)),
            UserInformationMutationStatus.RoleNotFound =>
                BadRequest(ApiResponse.ValidationError(
                    ["Selected role was not found."],
                    HttpContext.TraceIdentifier)),
            _ =>
                BadRequest(ApiResponse.ValidationError(
                    result.Errors.Count > 0
                        ? result.Errors
                        : ["Unable to update user information."],
                    HttpContext.TraceIdentifier))
        };
    }
}
