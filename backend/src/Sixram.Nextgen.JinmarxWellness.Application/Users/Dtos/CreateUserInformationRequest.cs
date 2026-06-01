using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

public class CreateUserInformationRequest : UpdateUserInformationRequest
{
    [JsonPropertyName("password")]
    public string Password { get; init; } = string.Empty;

    [JsonPropertyName("pin")]
    public string? Pin { get; init; }
}
