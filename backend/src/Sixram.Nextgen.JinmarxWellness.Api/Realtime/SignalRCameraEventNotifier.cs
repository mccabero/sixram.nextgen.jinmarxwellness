using Microsoft.AspNetCore.SignalR;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;

namespace Sixram.Nextgen.JinmarxWellness.Api.Realtime;

public class SignalRCameraEventNotifier : ICameraEventNotifier
{
    public const string CameraEventCreated = "CameraEventCreated";

    private readonly IHubContext<CameraEventHub> _hubContext;

    public SignalRCameraEventNotifier(IHubContext<CameraEventHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyCreatedAsync(
        CameraEventDto cameraEvent,
        CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync(
            CameraEventCreated,
            cameraEvent,
            cancellationToken);
    }
}
