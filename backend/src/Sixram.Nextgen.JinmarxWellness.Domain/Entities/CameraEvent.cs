using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class CameraEvent : AuditableEntity
{
    public string? CameraIp { get; set; }
    public string? Ipv6Address { get; set; }
    public int? PortNo { get; set; }
    public string? Protocol { get; set; }
    public string? MacAddress { get; set; }
    public int? ChannelId { get; set; }
    public string? ChannelName { get; set; }
    public DateTimeOffset EventDateTime { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventState { get; set; } = string.Empty;
    public string? EventDescription { get; set; }
    public int? ActivePostCount { get; set; }
    public string? Source { get; set; }
    public string? SnapshotPath { get; set; }
    public string? SnapshotUrl { get; set; }
    public DateTimeOffset? SnapshotCapturedAt { get; set; }
    public string? SnapshotError { get; set; }
    public string RawXml { get; set; } = string.Empty;
}
