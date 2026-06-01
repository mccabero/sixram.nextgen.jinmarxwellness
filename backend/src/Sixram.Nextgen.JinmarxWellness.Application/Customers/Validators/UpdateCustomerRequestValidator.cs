using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Validators;

public class UpdateCustomerRequestValidator
    : AbstractValidator<UpdateCustomerRequest>
{
    public UpdateCustomerRequestValidator()
    {
        Include(new CreateCustomerRequestValidator());
    }
}
