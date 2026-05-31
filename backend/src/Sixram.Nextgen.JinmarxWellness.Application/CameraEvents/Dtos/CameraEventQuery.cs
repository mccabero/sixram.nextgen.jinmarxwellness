namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

public class CameraEventQuery
{
    public string? EventType { get; set; }
    public string? EventState { get; set; }
    public DateTimeOffset? Start { get; set; }
    public DateTimeOffset? End { get; set; }
    public DateTimeOffset? CapturedStart { get; set; }
    public DateTimeOffset? CapturedEnd { get; set; }
    public int Take { get; set; } = 100;
}
