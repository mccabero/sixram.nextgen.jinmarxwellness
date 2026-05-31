using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;

public interface ICameraEventNotifier
{
    Task NotifyCreatedAsync(
        CameraEventDto cameraEvent,
        CancellationToken cancellationToken = default);
}
