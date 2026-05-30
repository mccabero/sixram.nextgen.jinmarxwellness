using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;

public class CreateServiceOfferingRequest
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("serviceCategoryId")]
    public int ServiceCategoryId { get; init; }

    [JsonPropertyName("category")]
    public string? Category { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("durationMinutes")]
    public int? DurationMinutes { get; init; }

    [JsonPropertyName("price")]
    public decimal? Price { get; init; }

    [JsonPropertyName("addOnDetails")]
    public string? AddOnDetails { get; init; }

    [JsonPropertyName("addOnRate")]
    public decimal? AddOnRate { get; init; }

    [JsonPropertyName("isHomeService")]
    public bool IsHomeService { get; init; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; } = true;
}
