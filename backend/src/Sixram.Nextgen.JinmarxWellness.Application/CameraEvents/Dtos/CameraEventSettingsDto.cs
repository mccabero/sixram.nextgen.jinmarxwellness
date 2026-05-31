namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

public class CameraEventSettingsDto
{
    public int CameraEventCooldownSeconds { get; set; }
    public bool SnapshotCaptureEnabled { get; set; }
    public string CameraIp { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string SnapshotChannel { get; set; } = "101";
    public bool PasswordConfigured { get; set; }
}
