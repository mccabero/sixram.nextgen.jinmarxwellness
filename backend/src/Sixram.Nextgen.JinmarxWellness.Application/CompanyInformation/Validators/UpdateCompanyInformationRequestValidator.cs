using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Validators;

public class UpdateCompanyInformationRequestValidator
    : AbstractValidator<UpdateCompanyInformationRequest>
{
    public UpdateCompanyInformationRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty()
            .WithMessage("Company name is required.")
            .MaximumLength(200);

        RuleFor(x => x.Tagline)
            .MaximumLength(200);

        RuleFor(x => x.CompanyAddress)
            .MaximumLength(500);

        RuleForEach(x => x.GCashNumbers)
            .SetValidator(new CompanyAccountDtoValidator());

        RuleForEach(x => x.BankAccounts)
            .SetValidator(new BankAccountDtoValidator());

        RuleFor(x => x.GCashNumbers)
            .Must(HaveSinglePrimaryWhenPresent)
            .WithMessage("GCash accounts must have exactly one primary account when entries exist.");

        RuleFor(x => x.BankAccounts)
            .Must(HaveSinglePrimaryWhenPresent)
            .WithMessage("Bank accounts must have exactly one primary account when entries exist.");
    }

    private static bool HaveSinglePrimaryWhenPresent<TAccount>(IReadOnlyCollection<TAccount>? accounts)
        where TAccount : class
    {
        if (accounts is null || accounts.Count == 0)
        {
            return true;
        }

        return accounts.Count(account =>
        {
            return account switch
            {
                CompanyAccountDto gcashAccount => gcashAccount.IsPrimary,
                BankAccountDto bankAccount => bankAccount.IsPrimary,
                _ => false
            };
        }) == 1;
    }
}
