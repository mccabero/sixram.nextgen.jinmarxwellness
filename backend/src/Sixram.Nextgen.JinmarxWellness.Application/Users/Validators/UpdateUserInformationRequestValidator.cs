using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Validators;

public class UpdateUserInformationRequestValidator
    : AbstractValidator<UpdateUserInformationRequest>
{
    public UpdateUserInformationRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email address is required.")
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.UserName)
            .NotEmpty()
            .WithMessage("Username is required.")
            .MaximumLength(256);

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50);

        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("Role is required.")
            .MaximumLength(256);
    }
}
