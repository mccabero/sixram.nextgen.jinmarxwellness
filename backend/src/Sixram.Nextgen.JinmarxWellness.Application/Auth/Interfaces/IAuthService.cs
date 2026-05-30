using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthSession> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthSession> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken);
    Task LogoutAsync(string? refreshToken, string? ipAddress, CancellationToken cancellationToken);
    Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken);
}
