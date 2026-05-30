using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Authentication;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;
    private readonly IDateTimeProvider _dateTimeProvider;

    public JwtTokenService(IOptions<JwtSettings> settings, IDateTimeProvider dateTimeProvider)
    {
        _settings = settings.Value;
        _dateTimeProvider = dateTimeProvider;
    }

    public GeneratedJwtToken GenerateToken(
        ApplicationUser user,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissionCodes)
    {
        if (string.IsNullOrWhiteSpace(_settings.SigningKey) || _settings.SigningKey.Length < 32)
        {
            throw new InvalidOperationException("JWT signing key must be at least 32 characters.");
        }

        var now = _dateTimeProvider.UtcNow;
        var expiresAt = now.AddMinutes(_settings.AccessTokenMinutes);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("full_name", user.FullName)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(permissionCodes.Select(permissionCode => new Claim(ApplicationClaimTypes.Permission, permissionCode)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new GeneratedJwtToken
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt
        };
    }
}
