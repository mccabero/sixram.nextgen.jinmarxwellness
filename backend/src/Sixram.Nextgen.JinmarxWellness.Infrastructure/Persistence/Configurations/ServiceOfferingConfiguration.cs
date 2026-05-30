using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Configurations;

public class ServiceOfferingConfiguration : IEntityTypeConfiguration<ServiceOffering>
{
    public void Configure(EntityTypeBuilder<ServiceOffering> builder)
    {
        builder.ToTable("ServiceOfferings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Category)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasOne(x => x.ServiceCategory)
            .WithMany(x => x.ServiceOfferings)
            .HasForeignKey(x => x.ServiceCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.Description)
            .HasMaxLength(500);

        builder.Property(x => x.Price)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.AddOnDetails)
            .HasMaxLength(250);

        builder.Property(x => x.AddOnRate)
            .HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.ServiceCategoryId);
        builder.HasIndex(x => x.IsActive);
    }
}
