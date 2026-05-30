using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Validators;

public class UpdateServiceOfferingRequestValidator
    : AbstractValidator<UpdateServiceOfferingRequest>
{
    public UpdateServiceOfferingRequestValidator()
    {
        Include(new CreateServiceOfferingRequestValidator());
    }
}
