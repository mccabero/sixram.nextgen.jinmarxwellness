using System.Text.Json.Serialization;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;

public class CreateAppointmentRequest
{
    [JsonPropertyName("customerName")]
    public string CustomerName { get; init; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("serviceOfferingId")]
    public int ServiceOfferingId { get; init; }

    [JsonPropertyName("scheduledAt")]
    public DateTimeOffset ScheduledAt { get; init; }

    [JsonPropertyName("status")]
    public AppointmentStatus Status { get; init; } = AppointmentStatus.Scheduled;

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }
}
