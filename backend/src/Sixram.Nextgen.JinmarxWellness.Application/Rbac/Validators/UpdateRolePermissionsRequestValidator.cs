using FluentValidation;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Rbac.Validators;

public class UpdateRolePermissionsRequestValidator : AbstractValidator<UpdateRolePermissionsRequest>
{
    public UpdateRolePermissionsRequestValidator()
    {
        var validPermissionCodes = ApplicationPermissions.All
            .Select(permission => permission.Code)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        RuleFor(x => x.PermissionCodes)
            .NotNull()
            .WithMessage("Permission codes are required.");

        RuleForEach(x => x.PermissionCodes)
            .NotEmpty()
            .Must(code => validPermissionCodes.Contains(code))
            .WithMessage("Permission code is not supported.");
    }
}
