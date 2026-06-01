using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class Appointment : AuditableEntity
{
    public string CustomerName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int ServiceOfferingId { get; set; }
    public ServiceOffering? ServiceOffering { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal? ServicePrice { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public string? Notes { get; set; }
}

public enum AppointmentStatus
{
    Scheduled = 0,
    Completed = 1,
    Cancelled = 2
}
