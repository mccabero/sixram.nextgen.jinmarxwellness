using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Sixram.Nextgen.JinmarxWellness.Api.Extensions;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IOptions<CookieSettings> _cookieOptions;

    public AuthController(IAuthService authService, IOptions<CookieSettings> cookieOptions)
    {
        _authService = authService;
        _cookieOptions = cookieOptions;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var session = await _authService.LoginAsync(
            request,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);

        Response.SetAuthCookies(session, _cookieOptions);
        return Success(session.Response, "Login successful.");
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[_cookieOptions.Value.RefreshTokenName];
        var session = await _authService.RefreshAsync(
            refreshToken ?? string.Empty,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);

        Response.SetAuthCookies(session, _cookieOptions);
        return Success(session.Response, "Session refreshed.");
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[_cookieOptions.Value.RefreshTokenName];
        await _authService.LogoutAsync(refreshToken, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        Response.ClearAuthCookies(_cookieOptions);
        return SuccessMessage("Logout successful.");
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CurrentUserResponse>>> Me(CancellationToken cancellationToken)
    {
        var user = await _authService.GetCurrentUserAsync(cancellationToken);
        return Success(user);
    }
}
