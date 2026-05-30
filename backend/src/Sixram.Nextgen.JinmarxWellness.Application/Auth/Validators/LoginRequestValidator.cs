using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.LoginMode)
            .NotEmpty()
            .Must(value => value.Equals("pin", StringComparison.OrdinalIgnoreCase)
                           || value.Equals("password", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Login mode must be pin or password.");

        When(x => x.LoginMode.Equals("pin", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.Pin)
                .NotEmpty()
                .Matches("^\\d{6}$")
                .WithMessage("Enter your 6-digit PIN.");
        });

        When(x => x.LoginMode.Equals("password", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.Username)
                .NotEmpty()
                .WithMessage("Username is required.");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required.");
        });
    }
}
