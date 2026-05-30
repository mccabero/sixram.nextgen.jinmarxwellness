using Microsoft.Extensions.Options;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authentication;

namespace Sixram.Nextgen.JinmarxWellness.Tests.Infrastructure;

public class JwtTokenServiceTests
{
    [Fact]
    public void GenerateToken_ReturnsTokenAndExpectedExpiration()
    {
        var now = new DateTimeOffset(2026, 5, 30, 10, 0, 0, TimeSpan.Zero);
        var service = new JwtTokenService(
            Options.Create(new JwtSettings
            {
                Issuer = "test-issuer",
                Audience = "test-audience",
                AccessTokenMinutes = 15,
                SigningKey = "THIS_IS_A_TEST_SIGNING_KEY_32_CHARS_MIN"
            }),
            new FixedDateTimeProvider(now));
        var user = new ApplicationUser
        {
            Id = 7,
            UserName = "owner@jinmarx.local",
            Email = "owner@jinmarx.local",
            FirstName = "Jinmarx",
            LastName = "Owner"
        };

        var token = service.GenerateToken(user, ["Admin"], ["dashboard.view"]);

        Assert.False(string.IsNullOrWhiteSpace(token.Token));
        Assert.Equal(now.AddMinutes(15), token.ExpiresAt);
    }

    private sealed class FixedDateTimeProvider : IDateTimeProvider
    {
        public FixedDateTimeProvider(DateTimeOffset utcNow)
        {
            UtcNow = utcNow;
        }

        public DateTimeOffset UtcNow { get; }
    }
}
