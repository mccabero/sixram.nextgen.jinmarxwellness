using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class ServiceCategory : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<ServiceOffering> ServiceOfferings { get; set; } = [];
}
