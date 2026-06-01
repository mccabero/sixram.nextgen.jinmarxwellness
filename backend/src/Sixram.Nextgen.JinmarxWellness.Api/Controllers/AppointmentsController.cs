using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/appointments")]
public class AppointmentsController : ApiControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.Appointments.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<AppointmentDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<AppointmentDto>>>> GetAppointments(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var appointments = await _appointmentService.GetAllAsync(from, to, cancellationToken);
        return Success(appointments);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.Appointments.View)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> GetAppointment(
        int id,
        CancellationToken cancellationToken)
    {
        var appointment = await _appointmentService.GetByIdAsync(id, cancellationToken);

        if (appointment is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Appointment was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(appointment);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.Appointments.Manage)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> CreateAppointment(
        [FromBody] CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _appointmentService.CreateAsync(request, cancellationToken);

        if (result.Status == AppointmentMutationStatus.ServiceOfferingNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected service was not found."],
                HttpContext.TraceIdentifier));
        }

        var appointment = result.Appointment!;

        return CreatedAtAction(
            nameof(GetAppointment),
            new { id = appointment.Id },
            ApiResponse.Success(appointment, "Appointment created successfully.", HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.Appointments.Manage)]
    [ProducesResponseType(typeof(ApiResponse<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AppointmentDto>>> UpdateAppointment(
        int id,
        [FromBody] UpdateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _appointmentService.UpdateAsync(id, request, cancellationToken);

        if (result.Status == AppointmentMutationStatus.AppointmentNotFound)
        {
            return NotFound(ApiResponse.Error<object>(
                "Appointment was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        if (result.Status == AppointmentMutationStatus.ServiceOfferingNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected service was not found."],
                HttpContext.TraceIdentifier));
        }

        return Success(result.Appointment!, "Appointment updated successfully.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(ApplicationPermissions.Appointments.Manage)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAppointment(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _appointmentService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse.Error<object>(
                "Appointment was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Appointment deleted successfully.");
    }
}
