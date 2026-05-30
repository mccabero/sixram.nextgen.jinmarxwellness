namespace Sixram.Nextgen.JinmarxWellness.Domain.Common;

public abstract class AuditableEntity
{
    public int Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTimeOffset? LastModifiedAt { get; set; }
    public int? LastModifiedByUserId { get; set; }
}
