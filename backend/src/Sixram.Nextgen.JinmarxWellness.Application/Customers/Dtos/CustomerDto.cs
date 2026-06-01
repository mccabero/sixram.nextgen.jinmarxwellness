using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

public class CustomerDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; init; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }

    [JsonPropertyName("visitCount")]
    public int VisitCount { get; init; }

    [JsonPropertyName("lastVisitAt")]
    public DateTimeOffset? LastVisitAt { get; init; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [JsonPropertyName("lastModifiedAt")]
    public DateTimeOffset? LastModifiedAt { get; init; }
}
