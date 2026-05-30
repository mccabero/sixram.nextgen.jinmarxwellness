namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

public class AuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public DateTimeOffset AccessTokenExpiresAt { get; init; }
    public CurrentUserResponse User { get; init; } = new();
}
