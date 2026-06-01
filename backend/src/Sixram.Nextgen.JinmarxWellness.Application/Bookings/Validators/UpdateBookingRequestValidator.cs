using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Dtos;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Bookings.Validators;

public class UpdateBookingRequestValidator
    : AbstractValidator<UpdateBookingRequest>
{
    public UpdateBookingRequestValidator()
    {
        RuleFor(x => x.Source)
            .IsInEnum();

        RuleFor(x => x.AppointmentId)
            .NotNull()
            .GreaterThan(0)
            .WithMessage("Appointment is required.")
            .When(x => x.Source == BookingSource.Appointment);

        RuleFor(x => x.ServiceOfferingId)
            .GreaterThan(0)
            .WithMessage("Service is required.")
            .When(x => x.Source == BookingSource.WalkIn);

        RuleFor(x => x.CustomerName)
            .MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50);

        RuleFor(x => x.BookedAt)
            .NotEmpty()
            .WithMessage("Booking date and time are required.");

        RuleFor(x => x.Status)
            .IsInEnum();

        RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}
