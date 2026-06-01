using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Appointments.Validators;

public class UpdateAppointmentRequestValidator
    : AbstractValidator<UpdateAppointmentRequest>
{
    public UpdateAppointmentRequestValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty()
            .WithMessage("Customer name is required.")
            .MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50);

        RuleFor(x => x.ServiceOfferingId)
            .GreaterThan(0)
            .WithMessage("Service is required.");

        RuleFor(x => x.ScheduledAt)
            .NotEmpty()
            .WithMessage("Appointment date and time are required.");

        RuleFor(x => x.Status)
            .IsInEnum();

        RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}
