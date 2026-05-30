using Microsoft.AspNetCore.Identity;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class ApplicationUser : IdentityUser<int>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PinHash { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();
}
