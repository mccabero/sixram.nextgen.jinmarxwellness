using System.Text.Json.Serialization;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;

public class BookingDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("source")]
    public BookingSource Source { get; init; }

    [JsonPropertyName("appointmentId")]
    public int? AppointmentId { get; init; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; init; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("serviceOfferingId")]
    public int ServiceOfferingId { get; init; }

    [JsonPropertyName("serviceName")]
    public string ServiceName { get; init; } = string.Empty;

    [JsonPropertyName("servicePrice")]
    public decimal? ServicePrice { get; init; }

    [JsonPropertyName("bookedAt")]
    public DateTimeOffset BookedAt { get; init; }

    [JsonPropertyName("status")]
    public BookingStatus Status { get; init; }

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [JsonPropertyName("lastModifiedAt")]
    public DateTimeOffset? LastModifiedAt { get; init; }
}
