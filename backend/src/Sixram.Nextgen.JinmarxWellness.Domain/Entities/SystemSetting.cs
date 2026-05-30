using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class SystemSetting : AuditableEntity
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string Group { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsEncrypted { get; set; }
}
