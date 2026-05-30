using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Validators;

public class CreateServiceCategoryRequestValidator
    : AbstractValidator<CreateServiceCategoryRequest>
{
    public CreateServiceCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Category name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}
