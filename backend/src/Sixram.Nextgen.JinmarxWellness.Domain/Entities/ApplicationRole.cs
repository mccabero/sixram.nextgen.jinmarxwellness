using Microsoft.AspNetCore.Identity;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class ApplicationRole : IdentityRole<int>
{
    public string? Description { get; set; }
}
