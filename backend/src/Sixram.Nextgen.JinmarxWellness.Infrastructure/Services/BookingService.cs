using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUserService _currentUserService;

    public BookingService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<BookingDto>> GetAllAsync(
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Bookings.AsNoTracking();

        if (from.HasValue)
        {
            query = query.Where(x => x.BookedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(x => x.BookedAt < to.Value);
        }

        return await query
            .OrderByDescending(x => x.BookedAt)
            .Select(x => new BookingDto
            {
                Id = x.Id,
                Source = x.Source,
                AppointmentId = x.AppointmentId,
                CustomerName = x.CustomerName,
                PhoneNumber = x.PhoneNumber,
                ServiceOfferingId = x.ServiceOfferingId,
                ServiceName = x.ServiceName,
                ServicePrice = x.ServicePrice,
                BookedAt = x.BookedAt,
                Status = x.Status,
                Notes = x.Notes,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<BookingDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return booking is null ? null : MapToDto(booking);
    }

    public async Task<BookingMutationResult> CreateAsync(
        CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var booking = new Booking
        {
            Source = request.Source,
            BookedAt = request.BookedAt,
            Status = request.Status,
            Notes = NormalizeOptional(request.Notes),
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = _currentUserService.UserId
        };

        var applyResult = await ApplyBookingDetailsAsync(
            booking,
            request.Source,
            request.AppointmentId,
            request.CustomerName,
            request.PhoneNumber,
            request.ServiceOfferingId,
            existingBookingId: null,
            cancellationToken);

        if (applyResult != BookingMutationStatus.Success)
        {
            return NewMutationResult(applyResult);
        }

        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BookingMutationResult.Success(MapToDto(booking));
    }

    public async Task<BookingMutationResult> UpdateAsync(
        int id,
        UpdateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (booking is null)
        {
            return BookingMutationResult.BookingNotFound();
        }

        booking.Source = request.Source;
        booking.BookedAt = request.BookedAt;
        booking.Status = request.Status;
        booking.Notes = NormalizeOptional(request.Notes);
        booking.LastModifiedAt = _dateTimeProvider.UtcNow;
        booking.LastModifiedByUserId = _currentUserService.UserId;

        var applyResult = await ApplyBookingDetailsAsync(
            booking,
            request.Source,
            request.AppointmentId,
            request.CustomerName,
            request.PhoneNumber,
            request.ServiceOfferingId,
            existingBookingId: id,
            cancellationToken);

        if (applyResult != BookingMutationStatus.Success)
        {
            return NewMutationResult(applyResult);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return BookingMutationResult.Success(MapToDto(booking));
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (booking is null)
        {
            return false;
        }

        _dbContext.Bookings.Remove(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task<BookingMutationStatus> ApplyBookingDetailsAsync(
        Booking booking,
        BookingSource source,
        int? appointmentId,
        string? customerName,
        string? phoneNumber,
        int serviceOfferingId,
        int? existingBookingId,
        CancellationToken cancellationToken)
    {
        if (source == BookingSource.Appointment)
        {
            if (!appointmentId.HasValue)
            {
                return BookingMutationStatus.AppointmentNotFound;
            }

            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(x => x.Id == appointmentId.Value, cancellationToken);

            if (appointment is null)
            {
                return BookingMutationStatus.AppointmentNotFound;
            }

            var duplicateExists = await _dbContext.Bookings
                .AnyAsync(
                    x => x.AppointmentId == appointment.Id
                        && (!existingBookingId.HasValue || x.Id != existingBookingId.Value),
                    cancellationToken);

            if (duplicateExists)
            {
                return BookingMutationStatus.AppointmentAlreadyBooked;
            }

            booking.AppointmentId = appointment.Id;
            booking.CustomerName = appointment.CustomerName;
            booking.PhoneNumber = appointment.PhoneNumber;
            booking.ServiceOfferingId = appointment.ServiceOfferingId;
            booking.ServiceName = appointment.ServiceName;
            booking.ServicePrice = appointment.ServicePrice;

            if (appointment.Status == AppointmentStatus.Scheduled)
            {
                appointment.Status = AppointmentStatus.Completed;
                appointment.LastModifiedAt = _dateTimeProvider.UtcNow;
                appointment.LastModifiedByUserId = _currentUserService.UserId;
            }

            return BookingMutationStatus.Success;
        }

        var serviceOffering = await _dbContext.ServiceOfferings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == serviceOfferingId, cancellationToken);

        if (serviceOffering is null)
        {
            return BookingMutationStatus.ServiceOfferingNotFound;
        }

        booking.AppointmentId = null;
        booking.CustomerName = NormalizeOptional(customerName);
        booking.PhoneNumber = NormalizeOptional(phoneNumber);
        booking.ServiceOfferingId = serviceOffering.Id;
        booking.ServiceName = serviceOffering.Name;
        booking.ServicePrice = serviceOffering.Price;

        return BookingMutationStatus.Success;
    }

    private static BookingDto MapToDto(Booking booking)
    {
        return new BookingDto
        {
            Id = booking.Id,
            Source = booking.Source,
            AppointmentId = booking.AppointmentId,
            CustomerName = booking.CustomerName,
            PhoneNumber = booking.PhoneNumber,
            ServiceOfferingId = booking.ServiceOfferingId,
            ServiceName = booking.ServiceName,
            ServicePrice = booking.ServicePrice,
            BookedAt = booking.BookedAt,
            Status = booking.Status,
            Notes = booking.Notes,
            CreatedAt = booking.CreatedAt,
            LastModifiedAt = booking.LastModifiedAt
        };
    }

    private static BookingMutationResult NewMutationResult(
        BookingMutationStatus status) =>
        status switch
        {
            BookingMutationStatus.AppointmentNotFound => BookingMutationResult.AppointmentNotFound(),
            BookingMutationStatus.AppointmentAlreadyBooked => BookingMutationResult.AppointmentAlreadyBooked(),
            BookingMutationStatus.ServiceOfferingNotFound => BookingMutationResult.ServiceOfferingNotFound(),
            _ => BookingMutationResult.BookingNotFound()
        };

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
