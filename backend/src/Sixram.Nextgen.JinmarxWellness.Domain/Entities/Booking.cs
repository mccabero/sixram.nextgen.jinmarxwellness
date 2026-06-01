using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class Booking : AuditableEntity
{
    public BookingSource Source { get; set; } = BookingSource.WalkIn;
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public string? CustomerName { get; set; }
    public string? PhoneNumber { get; set; }
    public int ServiceOfferingId { get; set; }
    public ServiceOffering? ServiceOffering { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal? ServicePrice { get; set; }
    public DateTimeOffset BookedAt { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Open;
    public string? Notes { get; set; }
}

public enum BookingSource
{
    WalkIn = 0,
    Appointment = 1
}

public enum BookingStatus
{
    Open = 0,
    Completed = 1,
    Cancelled = 2
}
