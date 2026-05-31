namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

public class CameraEventSummaryDto
{
    public int TotalToday { get; set; }
    public int ActiveToday { get; set; }
    public int VmdActiveToday { get; set; }
    public int Total { get; set; }
    public int Active { get; set; }
    public int VmdActive { get; set; }
    public int Captured { get; set; }
    public int SnapshotFailed { get; set; }
    public CameraEventDto? LastEvent { get; set; }
}
