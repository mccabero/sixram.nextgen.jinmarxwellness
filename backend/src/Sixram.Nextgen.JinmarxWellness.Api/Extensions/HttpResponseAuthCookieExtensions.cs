using Microsoft.Extensions.Options;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;

namespace Sixram.Nextgen.JinmarxWellness.Api.Extensions;

public static class HttpResponseAuthCookieExtensions
{
    public static void SetAuthCookies(
        this HttpResponse response,
        AuthSession session,
        IOptions<CookieSettings> cookieOptions)
    {
        var settings = cookieOptions.Value;
        response.Cookies.Append(
            settings.AccessTokenName,
            session.Response.AccessToken,
            CreateOptions(settings, session.Response.AccessTokenExpiresAt));

        response.Cookies.Append(
            settings.RefreshTokenName,
            session.RefreshToken,
            CreateOptions(settings, session.RefreshTokenExpiresAt));
    }

    public static void ClearAuthCookies(
        this HttpResponse response,
        IOptions<CookieSettings> cookieOptions)
    {
        var settings = cookieOptions.Value;
        response.Cookies.Delete(settings.AccessTokenName, CreateOptions(settings, DateTimeOffset.UtcNow.AddDays(-1)));
        response.Cookies.Delete(settings.RefreshTokenName, CreateOptions(settings, DateTimeOffset.UtcNow.AddDays(-1)));
    }

    private static CookieOptions CreateOptions(CookieSettings settings, DateTimeOffset expiresAt)
    {
        return new CookieOptions
        {
            HttpOnly = settings.HttpOnly,
            Secure = settings.Secure,
            SameSite = ParseSameSite(settings.SameSite),
            Path = settings.Path,
            Expires = expiresAt
        };
    }

    private static SameSiteMode ParseSameSite(string value)
    {
        return Enum.TryParse<SameSiteMode>(value, ignoreCase: true, out var sameSite)
            ? sameSite
            : SameSiteMode.Lax;
    }
}
