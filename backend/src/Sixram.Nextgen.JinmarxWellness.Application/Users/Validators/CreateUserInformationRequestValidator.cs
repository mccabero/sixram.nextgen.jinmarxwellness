using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Validators;

public class CreateUserInformationRequestValidator
    : AbstractValidator<CreateUserInformationRequest>
{
    public CreateUserInformationRequestValidator()
    {
        Include(new UpdateUserInformationRequestValidator());

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Temporary password is required.")
            .MinimumLength(8)
            .WithMessage("Temporary password must be at least 8 characters.")
            .Matches("[A-Z]")
            .WithMessage("Temporary password must include an uppercase letter.")
            .Matches("[a-z]")
            .WithMessage("Temporary password must include a lowercase letter.")
            .Matches("[0-9]")
            .WithMessage("Temporary password must include a number.");

        RuleFor(x => x.Pin)
            .Matches("^\\d{6}$")
            .WithMessage("PIN must be 6 digits.")
            .When(x => !string.IsNullOrWhiteSpace(x.Pin));
    }
}
