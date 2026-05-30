using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Validators;

public class CompanyAccountDtoValidator : AbstractValidator<CompanyAccountDto>
{
    public CompanyAccountDtoValidator()
    {
        RuleFor(x => x.AccountName)
            .NotEmpty()
            .WithMessage("Account name is required.")
            .MaximumLength(150);

        RuleFor(x => x.AccountNumber)
            .NotEmpty()
            .WithMessage("Account number is required.")
            .MaximumLength(100);
    }
}
