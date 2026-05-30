namespace Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;

public class CookieSettings
{
    public string AccessTokenName { get; set; } = "jinmarx_access_token";
    public string RefreshTokenName { get; set; } = "jinmarx_refresh_token";
    public bool HttpOnly { get; set; } = true;
    public bool Secure { get; set; }
    public string SameSite { get; set; } = "Lax";
    public string Path { get; set; } = "/";
}
