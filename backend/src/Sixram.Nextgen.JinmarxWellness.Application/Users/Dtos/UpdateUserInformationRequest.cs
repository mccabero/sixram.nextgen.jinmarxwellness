using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

public class UpdateUserInformationRequest
{
    [JsonPropertyName("firstName")]
    public string FirstName { get; init; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; init; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; init; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("username")]
    public string UserName { get; init; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; init; } = string.Empty;

    [JsonPropertyName("isTherapist")]
    public bool IsTherapist { get; init; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; } = true;
}
