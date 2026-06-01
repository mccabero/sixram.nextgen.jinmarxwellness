namespace Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;

public enum BookingMutationStatus
{
    Success,
    BookingNotFound,
    AppointmentNotFound,
    AppointmentAlreadyBooked,
    ServiceOfferingNotFound
}

public sealed class BookingMutationResult
{
    private BookingMutationResult(
        BookingMutationStatus status,
        BookingDto? booking = null)
    {
        Status = status;
        Booking = booking;
    }

    public BookingMutationStatus Status { get; }
    public BookingDto? Booking { get; }

    public static BookingMutationResult Success(BookingDto booking)
        => new(BookingMutationStatus.Success, booking);

    public static BookingMutationResult BookingNotFound()
        => new(BookingMutationStatus.BookingNotFound);

    public static BookingMutationResult AppointmentNotFound()
        => new(BookingMutationStatus.AppointmentNotFound);

    public static BookingMutationResult AppointmentAlreadyBooked()
        => new(BookingMutationStatus.AppointmentAlreadyBooked);

    public static BookingMutationResult ServiceOfferingNotFound()
        => new(BookingMutationStatus.ServiceOfferingNotFound);
}
