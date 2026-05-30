using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher = new();

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService,
        ICurrentUserService currentUserService,
        IDateTimeProvider dateTimeProvider)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
        _currentUserService = currentUserService;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<AuthSession> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var user = request.LoginMode.Equals("pin", StringComparison.OrdinalIgnoreCase)
            ? await FindByPinAsync(request.Pin ?? string.Empty, cancellationToken)
            : await FindByPasswordAsync(request.Username ?? string.Empty, request.Password ?? string.Empty);

        if (user is null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid username, password, or PIN.");
        }

        user.LastLoginAt = _dateTimeProvider.UtcNow;
        await _userManager.UpdateAsync(user);

        return await CreateSessionAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthSession> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken)
    {
        var currentRefreshToken = await _refreshTokenService.FindActiveAsync(refreshToken, cancellationToken);
        if (currentRefreshToken is null || !currentRefreshToken.User.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token is invalid or expired.");
        }

        var session = await CreateSessionAsync(currentRefreshToken.User, ipAddress, cancellationToken);
        await _refreshTokenService.RevokeAsync(
            currentRefreshToken,
            ipAddress,
            session.RefreshToken,
            cancellationToken);

        return session;
    }

    public async Task LogoutAsync(string? refreshToken, string? ipAddress, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var token = await _refreshTokenService.FindActiveAsync(refreshToken, cancellationToken);
        if (token is not null)
        {
            await _refreshTokenService.RevokeAsync(token, ipAddress, null, cancellationToken);
        }
    }

    public async Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is null)
        {
            throw new UnauthorizedAccessException("Authentication is required.");
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(x => x.Id == _currentUserService.UserId.Value, cancellationToken);

        if (user is null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Authentication is required.");
        }

        return await ToCurrentUserResponseAsync(user);
    }

    private async Task<ApplicationUser?> FindByPasswordAsync(string username, string password)
    {
        var user = await _userManager.FindByNameAsync(username)
                   ?? await _userManager.FindByEmailAsync(username);

        if (user is null || !await _userManager.CheckPasswordAsync(user, password))
        {
            return null;
        }

        return user;
    }

    private async Task<ApplicationUser?> FindByPinAsync(string pin, CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .Where(x => x.IsActive && x.PinHash != null)
            .ToListAsync(cancellationToken);

        return users.FirstOrDefault(user =>
            _passwordHasher.VerifyHashedPassword(user, user.PinHash!, pin)
            != PasswordVerificationResult.Failed);
    }

    private async Task<AuthSession> CreateSessionAsync(
        ApplicationUser user,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);
        var accessToken = _jwtTokenService.GenerateToken(
            user,
            roles.ToArray(),
            permissions.Select(permission => permission.Code).ToArray());
        var refreshToken = await _refreshTokenService.CreateAsync(user, ipAddress, cancellationToken);

        return new AuthSession
        {
            Response = new AuthResponse
            {
                AccessToken = accessToken.Token,
                AccessTokenExpiresAt = accessToken.ExpiresAt,
                User = await ToCurrentUserResponseAsync(user)
            },
            RefreshToken = refreshToken.RawToken,
            RefreshTokenExpiresAt = refreshToken.Entity.ExpiresAt
        };
    }

    private async Task<CurrentUserResponse> ToCurrentUserResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);

        return new CurrentUserResponse
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Roles = roles.ToArray(),
            Permissions = permissions
        };
    }

    private async Task<IReadOnlyCollection<UserPermissionResponse>> GetPermissionsForRolesAsync(
        IEnumerable<string> roles)
    {
        var permissionDefinitions = ApplicationPermissions.All
            .ToDictionary(permission => permission.Code, StringComparer.OrdinalIgnoreCase);
        var permissionCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var roleName in roles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null)
            {
                continue;
            }

            var claims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in claims.Where(claim => claim.Type == ApplicationClaimTypes.Permission))
            {
                permissionCodes.Add(claim.Value);
            }
        }

        return permissionCodes
            .OrderBy(code => code)
            .Select(code =>
            {
                var definition = permissionDefinitions.GetValueOrDefault(code);
                return new UserPermissionResponse
                {
                    Code = code,
                    Name = definition?.Name ?? code
                };
            })
            .ToArray();
    }
}
