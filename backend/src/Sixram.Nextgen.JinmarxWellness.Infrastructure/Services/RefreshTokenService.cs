using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly JwtSettings _jwtSettings;

    public RefreshTokenService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        IOptions<JwtSettings> jwtSettings)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<(string RawToken, RefreshToken Entity)> CreateAsync(
        ApplicationUser user,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var token = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawToken),
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = user.Id,
            CreatedByIpAddress = ipAddress,
            ExpiresAt = _dateTimeProvider.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        };

        _dbContext.RefreshTokens.Add(token);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (rawToken, token);
    }

    public Task<RefreshToken?> FindActiveAsync(string rawToken, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(rawToken);
        var now = _dateTimeProvider.UtcNow;

        return _dbContext.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.TokenHash == tokenHash
                     && x.RevokedAt == null
                     && x.ExpiresAt > now,
                cancellationToken);
    }

    public async Task RevokeAsync(
        RefreshToken token,
        string? ipAddress,
        string? replacementRawToken,
        CancellationToken cancellationToken)
    {
        token.RevokedAt = _dateTimeProvider.UtcNow;
        token.RevokedByIpAddress = ipAddress;
        token.ReplacedByTokenHash = string.IsNullOrWhiteSpace(replacementRawToken)
            ? null
            : HashToken(replacementRawToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }
}
