using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Key)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Group)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(x => x.Key)
            .IsUnique();

        builder.HasIndex(x => x.Group);
    }
}
