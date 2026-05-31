using Microsoft.AspNetCore.SignalR;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Realtime;

[RequirePermission(ApplicationPermissions.CameraEvents.View)]
public class CameraEventHub : Hub
{
}
