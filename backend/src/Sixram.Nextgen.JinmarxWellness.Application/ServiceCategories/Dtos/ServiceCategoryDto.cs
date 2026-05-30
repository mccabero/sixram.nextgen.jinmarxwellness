using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

public class ServiceCategoryDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("serviceCount")]
    public int ServiceCount { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [JsonPropertyName("lastModifiedAt")]
    public DateTimeOffset? LastModifiedAt { get; init; }
}
