using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;

public interface ICameraEventService
{
    Task<CameraAlarmResultDto> ReceiveAlarmAsync(
        string rawPayload,
        string? remoteIpAddress,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<CameraEventDto>> GetEventsAsync(
        CameraEventQuery query,
        CancellationToken cancellationToken = default);

    Task<CameraEventSummaryDto> GetSummaryAsync(
        CameraEventQuery query,
        CancellationToken cancellationToken = default);

    Task<ClearCameraEventsResultDto> ClearEventsAsync(CancellationToken cancellationToken = default);

    Task<bool> DeleteEventAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<CameraSnapshotFileDto?> GetSnapshotAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<CameraEventSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<CameraEventSettingsDto> UpdateSettingsAsync(
        UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken = default);

    Task<CameraSnapshotTestResultDto> TestSnapshotAsync(
        UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken = default);
}
