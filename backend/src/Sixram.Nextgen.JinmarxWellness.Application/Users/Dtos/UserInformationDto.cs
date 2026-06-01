using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

public class UserInformationDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("username")]
    public string UserName { get; init; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; init; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; init; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; init; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("role")]
    public string Role { get; init; } = string.Empty;

    [JsonPropertyName("roles")]
    public IReadOnlyCollection<string> Roles { get; init; } = [];

    [JsonPropertyName("isTherapist")]
    public bool IsTherapist { get; init; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; }

    [JsonPropertyName("hasPinConfigured")]
    public bool HasPinConfigured { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [JsonPropertyName("lastLoginAt")]
    public DateTimeOffset? LastLoginAt { get; init; }
}
