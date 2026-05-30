using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Validators;

public class CreateServiceOfferingRequestValidator
    : AbstractValidator<CreateServiceOfferingRequest>
{
    public CreateServiceOfferingRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Service name is required.")
            .MaximumLength(150);

        RuleFor(x => x.ServiceCategoryId)
            .GreaterThan(0)
            .WithMessage("Category is required.");

        RuleFor(x => x.Category)
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0)
            .When(x => x.DurationMinutes.HasValue)
            .WithMessage("Duration must be greater than zero.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Price.HasValue)
            .WithMessage("Price must not be negative.");

        RuleFor(x => x.AddOnDetails)
            .MaximumLength(250);

        RuleFor(x => x.AddOnRate)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AddOnRate.HasValue)
            .WithMessage("Add-on rate must not be negative.");
    }
}
