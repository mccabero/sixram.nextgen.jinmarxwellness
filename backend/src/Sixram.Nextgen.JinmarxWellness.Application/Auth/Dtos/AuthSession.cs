namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

public class AuthSession
{
    public AuthResponse Response { get; init; } = new();
    public string RefreshToken { get; init; } = string.Empty;
    public DateTimeOffset RefreshTokenExpiresAt { get; init; }
}
