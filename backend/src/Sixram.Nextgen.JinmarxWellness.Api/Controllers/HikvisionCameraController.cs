using System.Text;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/camera/hikvision")]
public class HikvisionCameraController : ApiControllerBase
{
    private readonly ICameraEventService _cameraEventService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HikvisionCameraController> _logger;

    public HikvisionCameraController(
        ICameraEventService cameraEventService,
        IConfiguration configuration,
        ILogger<HikvisionCameraController> logger)
    {
        _cameraEventService = cameraEventService;
        _configuration = configuration;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("alarm")]
    [DisableFormValueModelBinding]
    [ProducesResponseType(typeof(ApiResponse<CameraAlarmResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<CameraAlarmResultDto>>> ReceiveAlarm(CancellationToken cancellationToken)
    {
        if (!IsAlarmApiKeyValid())
        {
            _logger.LogWarning(
                "Rejected Hikvision alarm request from {RemoteIp} because the alarm API key was missing or invalid.",
                HttpContext.Connection.RemoteIpAddress);

            return Unauthorized(ApiResponse.Unauthorized(
                "Invalid camera alarm API key.",
                traceId: HttpContext.TraceIdentifier));
        }

        using var memoryStream = new MemoryStream();
        await Request.Body.CopyToAsync(memoryStream, cancellationToken);

        var rawPayload = Encoding.UTF8.GetString(memoryStream.ToArray()).Trim();

        try
        {
            var result = await _cameraEventService.ReceiveAlarmAsync(
                rawPayload,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);

            return Success(
                result,
                result.Ignored ? "Camera alarm ignored." : "Camera alarm accepted.");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid Hikvision alarm payload received from {RemoteIp}. Content-Type: {ContentType}. Payload preview: {PayloadPreview}",
                HttpContext.Connection.RemoteIpAddress,
                Request.ContentType,
                rawPayload.Length > 256 ? rawPayload[..256] : rawPayload);

            return BadRequest(ApiResponse.ValidationError(
                [ex.Message],
                HttpContext.TraceIdentifier,
                "Invalid Hikvision alarm payload."));
        }
    }

    [AllowAnonymous]
    [HttpGet("alarm")]
    [HttpHead("alarm")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<object>> TestAlarmEndpoint()
    {
        if (!IsAlarmApiKeyValid())
        {
            _logger.LogWarning(
                "Rejected Hikvision alarm endpoint test from {RemoteIp} because the alarm API key was missing or invalid.",
                HttpContext.Connection.RemoteIpAddress);

            return Unauthorized(ApiResponse.Unauthorized(
                "Invalid camera alarm API key.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Hikvision alarm endpoint is available.");
    }

    private bool IsAlarmApiKeyValid()
    {
        var configuredKey = _configuration["CameraEvents:AlarmApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return true;
        }

        var suppliedKey = FirstNonEmpty(
            Request.Query["key"].FirstOrDefault(),
            Request.Query["apiKey"].FirstOrDefault(),
            Request.Headers["X-Camera-Alarm-Key"].FirstOrDefault());

        if (string.IsNullOrWhiteSpace(suppliedKey))
        {
            return false;
        }

        var configuredBytes = Encoding.UTF8.GetBytes(configuredKey.Trim());
        var suppliedBytes = Encoding.UTF8.GetBytes(suppliedKey.Trim());

        return configuredBytes.Length == suppliedBytes.Length
            && CryptographicOperations.FixedTimeEquals(configuredBytes, suppliedBytes);
    }

    private static string? FirstNonEmpty(params string?[] values)
        => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    [HttpGet("events")]
    [RequirePermission(ApplicationPermissions.CameraEvents.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<CameraEventDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<CameraEventDto>>>> GetEvents(
        [FromQuery] CameraEventQuery query,
        CancellationToken cancellationToken)
    {
        var events = await _cameraEventService.GetEventsAsync(query, cancellationToken);
        return Success(events);
    }

    [HttpGet("summary")]
    [RequirePermission(ApplicationPermissions.CameraEvents.View)]
    [ProducesResponseType(typeof(ApiResponse<CameraEventSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CameraEventSummaryDto>>> GetSummary(
        [FromQuery] CameraEventQuery query,
        CancellationToken cancellationToken)
    {
        var summary = await _cameraEventService.GetSummaryAsync(query, cancellationToken);
        return Success(summary);
    }

    [HttpDelete("events")]
    [RequirePermission(ApplicationPermissions.CameraEvents.Manage)]
    [ProducesResponseType(typeof(ApiResponse<ClearCameraEventsResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ClearCameraEventsResultDto>>> ClearEvents(
        CancellationToken cancellationToken)
    {
        var result = await _cameraEventService.ClearEventsAsync(cancellationToken);
        return Success(result, "Camera events cleared successfully.");
    }

    [HttpDelete("events/{id:int}")]
    [RequirePermission(ApplicationPermissions.CameraEvents.Manage)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEvent(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _cameraEventService.DeleteEventAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse.Error<object>(
                "Camera event was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Camera event deleted successfully.");
    }

    [HttpGet("events/{id:int}/snapshot")]
    [RequirePermission(ApplicationPermissions.CameraEvents.View)]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSnapshot(int id, CancellationToken cancellationToken)
    {
        var snapshot = await _cameraEventService.GetSnapshotAsync(id, cancellationToken);

        if (snapshot is null)
        {
            return NotFound();
        }

        return PhysicalFile(snapshot.AbsolutePath, snapshot.ContentType);
    }

    [HttpGet("settings")]
    [RequirePermission(ApplicationPermissions.CameraEvents.View)]
    [ProducesResponseType(typeof(ApiResponse<CameraEventSettingsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CameraEventSettingsDto>>> GetSettings(
        CancellationToken cancellationToken)
    {
        var settings = await _cameraEventService.GetSettingsAsync(cancellationToken);
        return Success(settings);
    }

    [HttpPut("settings")]
    [RequirePermission(ApplicationPermissions.CameraEvents.Manage)]
    [ProducesResponseType(typeof(ApiResponse<CameraEventSettingsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CameraEventSettingsDto>>> UpdateSettings(
        [FromBody] UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var settings = await _cameraEventService.UpdateSettingsAsync(request, cancellationToken);
        return Success(settings, "Camera settings updated successfully.");
    }

    [HttpPost("settings/test-snapshot")]
    [RequirePermission(ApplicationPermissions.CameraEvents.Manage)]
    [ProducesResponseType(typeof(ApiResponse<CameraSnapshotTestResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<CameraSnapshotTestResultDto>>> TestSnapshot(
        [FromBody] UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _cameraEventService.TestSnapshotAsync(request, cancellationToken);
            return Success(result, "Camera snapshot captured successfully.");
        }
        catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Hikvision snapshot test failed.");

            return BadRequest(ApiResponse.Error<object>(
                "Hikvision snapshot test failed.",
                [ex.Message],
                HttpContext.TraceIdentifier));
        }
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class DisableFormValueModelBindingAttribute : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var factories = context.ValueProviderFactories;
        RemoveFactory<FormValueProviderFactory>(factories);
        RemoveFactory<FormFileValueProviderFactory>(factories);
        RemoveFactory<JQueryFormValueProviderFactory>(factories);
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }

    private static void RemoveFactory<TFactory>(IList<IValueProviderFactory> factories)
    {
        var factory = factories.OfType<TFactory>().FirstOrDefault();
        if (factory is not null)
        {
            factories.Remove((IValueProviderFactory)factory);
        }
    }
}
