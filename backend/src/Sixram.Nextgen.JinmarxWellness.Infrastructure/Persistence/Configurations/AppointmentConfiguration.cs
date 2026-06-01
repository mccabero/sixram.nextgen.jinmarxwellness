using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CustomerName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.PhoneNumber)
            .HasMaxLength(50);

        builder.HasOne(x => x.ServiceOffering)
            .WithMany()
            .HasForeignKey(x => x.ServiceOfferingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.ServiceName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.ServicePrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(AppointmentStatus.Scheduled);

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.ScheduledAt);
        builder.HasIndex(x => x.ServiceOfferingId);
        builder.HasIndex(x => x.Status);
    }
}
