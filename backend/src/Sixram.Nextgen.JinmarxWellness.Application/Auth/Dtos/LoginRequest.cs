namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

public class LoginRequest
{
    public string LoginMode { get; set; } = "password";
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? Pin { get; set; }
}
