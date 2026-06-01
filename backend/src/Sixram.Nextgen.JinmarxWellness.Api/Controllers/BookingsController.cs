using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/bookings")]
public class BookingsController : ApiControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.PointOfSale.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<BookingDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<BookingDto>>>> GetBookings(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var bookings = await _bookingService.GetAllAsync(from, to, cancellationToken);
        return Success(bookings);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.PointOfSale.View)]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> GetBooking(
        int id,
        CancellationToken cancellationToken)
    {
        var booking = await _bookingService.GetByIdAsync(id, cancellationToken);

        if (booking is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Booking was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(booking);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.PointOfSale.Manage)]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> CreateBooking(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.CreateAsync(request, cancellationToken);

        var errorResult = ToErrorResult(result.Status);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var booking = result.Booking!;

        return CreatedAtAction(
            nameof(GetBooking),
            new { id = booking.Id },
            ApiResponse.Success(booking, "Booking created successfully.", HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.PointOfSale.Manage)]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> UpdateBooking(
        int id,
        [FromBody] UpdateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.UpdateAsync(id, request, cancellationToken);

        if (result.Status == BookingMutationStatus.BookingNotFound)
        {
            return NotFound(ApiResponse.Error<object>(
                "Booking was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        var errorResult = ToErrorResult(result.Status);
        if (errorResult is not null)
        {
            return errorResult;
        }

        return Success(result.Booking!, "Booking updated successfully.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(ApplicationPermissions.PointOfSale.Manage)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBooking(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _bookingService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse.Error<object>(
                "Booking was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Booking deleted successfully.");
    }

    private ActionResult<ApiResponse<BookingDto>>? ToErrorResult(
        BookingMutationStatus status)
    {
        if (status == BookingMutationStatus.AppointmentNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected appointment was not found."],
                HttpContext.TraceIdentifier));
        }

        if (status == BookingMutationStatus.AppointmentAlreadyBooked)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected appointment is already converted to a booking."],
                HttpContext.TraceIdentifier));
        }

        if (status == BookingMutationStatus.ServiceOfferingNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected service was not found."],
                HttpContext.TraceIdentifier));
        }

        return null;
    }
}
