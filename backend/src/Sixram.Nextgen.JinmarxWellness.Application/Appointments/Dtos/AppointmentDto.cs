using System.Text.Json.Serialization;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;

public class AppointmentDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("customerName")]
    public string CustomerName { get; init; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("serviceOfferingId")]
    public int ServiceOfferingId { get; init; }

    [JsonPropertyName("serviceName")]
    public string ServiceName { get; init; } = string.Empty;

    [JsonPropertyName("servicePrice")]
    public decimal? ServicePrice { get; init; }

    [JsonPropertyName("scheduledAt")]
    public DateTimeOffset ScheduledAt { get; init; }

    [JsonPropertyName("status")]
    public AppointmentStatus Status { get; init; }

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [JsonPropertyName("lastModifiedAt")]
    public DateTimeOffset? LastModifiedAt { get; init; }
}
