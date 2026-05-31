namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

public class UpdateHikvisionCameraSettingsRequest
{
    public int? CameraEventCooldownSeconds { get; set; }
    public bool? SnapshotCaptureEnabled { get; set; }
    public string? CameraIp { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? SnapshotChannel { get; set; }
}

public class CameraAlarmResultDto
{
    public bool Ignored { get; set; }
    public string? Reason { get; set; }
    public int? CooldownSeconds { get; set; }
    public DateTimeOffset? LastAcceptedAt { get; set; }
    public int? Id { get; set; }
    public string? CameraIp { get; set; }
    public string? EventType { get; set; }
    public string? EventState { get; set; }
    public DateTimeOffset? EventDateTime { get; set; }
    public string? SnapshotUrl { get; set; }
}

public class ClearCameraEventsResultDto
{
    public int DeletedCount { get; set; }
}

public class CameraSnapshotFileDto
{
    public string AbsolutePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "image/jpeg";
}

public class CameraSnapshotTestResultDto
{
    public DateTimeOffset CapturedAt { get; set; }
    public string ImageDataUrl { get; set; } = string.Empty;
}
