using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Bookings.Interfaces;

public interface IBookingService
{
    Task<IReadOnlyCollection<BookingDto>> GetAllAsync(
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default);

    Task<BookingDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<BookingMutationResult> CreateAsync(
        CreateBookingRequest request,
        CancellationToken cancellationToken = default);

    Task<BookingMutationResult> UpdateAsync(
        int id,
        UpdateBookingRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
