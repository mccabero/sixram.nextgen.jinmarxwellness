using Sixram.Nextgen.JinmarxWellness.Domain.Common;

namespace Sixram.Nextgen.JinmarxWellness.Domain.Entities;

public class ServiceOffering : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public int ServiceCategoryId { get; set; }
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Price { get; set; }
    public string? AddOnDetails { get; set; }
    public decimal? AddOnRate { get; set; }
    public bool IsHomeService { get; set; }
    public bool IsActive { get; set; } = true;
}
