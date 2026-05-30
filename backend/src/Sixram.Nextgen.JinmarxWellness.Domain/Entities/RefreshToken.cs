using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class RefreshToken : AuditableEntity
{
    public int UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? CreatedByIpAddress { get; set; }
    public string? RevokedByIpAddress { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
