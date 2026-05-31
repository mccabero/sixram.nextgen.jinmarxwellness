using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Configurations;

public class CameraEventConfiguration : IEntityTypeConfiguration<CameraEvent>
{
    public void Configure(EntityTypeBuilder<CameraEvent> builder)
    {
        builder.ToTable("CameraEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CameraIp)
            .HasMaxLength(64);

        builder.Property(x => x.Ipv6Address)
            .HasMaxLength(80);

        builder.Property(x => x.Protocol)
            .HasMaxLength(20);

        builder.Property(x => x.MacAddress)
            .HasMaxLength(32);

        builder.Property(x => x.ChannelName)
            .HasMaxLength(100);

        builder.Property(x => x.EventType)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(x => x.EventState)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.EventDescription)
            .HasMaxLength(200);

        builder.Property(x => x.Source)
            .HasMaxLength(80);

        builder.Property(x => x.SnapshotPath)
            .HasMaxLength(300);

        builder.Property(x => x.SnapshotUrl)
            .HasMaxLength(300);

        builder.Property(x => x.SnapshotError)
            .HasMaxLength(500);

        builder.Property(x => x.RawXml)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        builder.HasIndex(x => x.EventDateTime)
            .HasDatabaseName("IX_CameraEvents_EventDateTime");

        builder.HasIndex(x => new { x.EventType, x.EventState, x.EventDateTime })
            .HasDatabaseName("IX_CameraEvents_Type_State_DateTime");

        builder.HasIndex(x => new { x.CameraIp, x.EventDateTime })
            .HasDatabaseName("IX_CameraEvents_CameraIp_EventDateTime");
    }
}
