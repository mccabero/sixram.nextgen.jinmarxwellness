using System.Text.Json.Serialization;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;

public class UpdateBookingRequest
{
    [JsonPropertyName("source")]
    public BookingSource Source { get; init; } = BookingSource.WalkIn;

    [JsonPropertyName("appointmentId")]
    public int? AppointmentId { get; init; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; init; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [JsonPropertyName("serviceOfferingId")]
    public int ServiceOfferingId { get; init; }

    [JsonPropertyName("bookedAt")]
    public DateTimeOffset BookedAt { get; init; }

    [JsonPropertyName("status")]
    public BookingStatus Status { get; init; } = BookingStatus.Open;

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }
}
