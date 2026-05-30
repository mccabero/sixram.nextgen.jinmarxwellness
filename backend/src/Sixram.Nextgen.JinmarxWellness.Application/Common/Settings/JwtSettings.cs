namespace Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;

public class JwtSettings
{
    public string Issuer { get; set; } = "sixram.nextgen.jinmarx-wellness";
    public string Audience { get; set; } = "sixram.nextgen.jinmarx-wellness.frontend";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
    public string SigningKey { get; set; } = string.Empty;
}
