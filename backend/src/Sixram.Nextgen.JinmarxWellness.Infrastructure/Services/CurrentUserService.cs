using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var userId) ? userId : null;
        }
    }

    public string? UserName => _httpContextAccessor.HttpContext?.User.Identity?.Name;
}
