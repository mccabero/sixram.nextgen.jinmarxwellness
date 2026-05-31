namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

public class CameraEventDto
{
    public int Id { get; set; }
    public string? CameraIp { get; set; }
    public int? ChannelId { get; set; }
    public string? ChannelName { get; set; }
    public DateTimeOffset EventDateTime { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventState { get; set; } = string.Empty;
    public string? EventDescription { get; set; }
    public int? ActivePostCount { get; set; }
    public string? Source { get; set; }
    public string? SnapshotUrl { get; set; }
    public DateTimeOffset? SnapshotCapturedAt { get; set; }
    public string? SnapshotError { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
