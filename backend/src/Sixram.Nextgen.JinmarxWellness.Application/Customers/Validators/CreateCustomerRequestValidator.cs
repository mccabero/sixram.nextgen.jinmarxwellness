using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Validators;

public class CreateCustomerRequestValidator
    : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Customer name is required.")
            .MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .WithMessage("Phone number is required.")
            .MaximumLength(50);

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email))
            .MaximumLength(256);

        RuleFor(x => x.Notes)
            .MaximumLength(1000);

        RuleFor(x => x.VisitCount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Visit count must not be negative.");
    }
}
