using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

public class CreateServiceCategoryRequest
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; init; }
}
