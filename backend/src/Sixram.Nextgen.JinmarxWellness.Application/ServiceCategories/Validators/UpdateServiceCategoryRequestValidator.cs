using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Validators;

public class UpdateServiceCategoryRequestValidator
    : AbstractValidator<UpdateServiceCategoryRequest>
{
    public UpdateServiceCategoryRequestValidator()
    {
        Include(new CreateServiceCategoryRequestValidator());
    }
}
