using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.Property(x => x.Description)
            .HasMaxLength(250);
    }
}
