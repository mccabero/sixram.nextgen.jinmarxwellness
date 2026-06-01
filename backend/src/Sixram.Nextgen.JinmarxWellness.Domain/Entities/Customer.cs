using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class Customer : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public int VisitCount { get; set; }
    public DateTimeOffset? LastVisitAt { get; set; }
    public bool IsActive { get; set; } = true;
}
