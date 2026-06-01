using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

public class CreateCustomerRequest
{
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
    public bool IsActive { get; init; } = true;
}
