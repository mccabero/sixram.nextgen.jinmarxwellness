using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;

public interface IRefreshTokenService
{
    Task<(string RawToken, RefreshToken Entity)> CreateAsync(
        ApplicationUser user,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<RefreshToken?> FindActiveAsync(string rawToken, CancellationToken cancellationToken);
    Task RevokeAsync(RefreshToken token, string? ipAddress, string? replacementRawToken, CancellationToken cancellationToken);
}
