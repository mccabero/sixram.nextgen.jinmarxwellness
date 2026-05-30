using Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;

public interface IJwtTokenService
{
    GeneratedJwtToken GenerateToken(
        ApplicationUser user,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissionCodes);
}
