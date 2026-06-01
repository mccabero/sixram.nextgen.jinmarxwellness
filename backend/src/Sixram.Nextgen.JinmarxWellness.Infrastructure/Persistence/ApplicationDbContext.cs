using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
{
    public const string IntKeySequenceName = "JinmarxWellnessIntIds";

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServiceOffering> ServiceOfferings => Set<ServiceOffering>();
    public DbSet<CameraEvent> CameraEvents => Set<CameraEvent>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        var useSqlServerSequenceKeys = Database.IsSqlServer();

        if (useSqlServerSequenceKeys)
        {
            builder.HasSequence<int>(IntKeySequenceName)
                .StartsAt(1)
                .IncrementsBy(1);
        }

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            var primaryKey = entityType.FindPrimaryKey();
            if (primaryKey?.Properties.Count != 1)
            {
                continue;
            }

            var keyProperty = primaryKey.Properties[0];
            if (keyProperty.ClrType != typeof(int)
                || !string.Equals(keyProperty.Name, "Id", StringComparison.Ordinal))
            {
                continue;
            }

            if (entityType.ClrType.Assembly != typeof(ApplicationUser).Assembly)
            {
                continue;
            }

            var idPropertyBuilder = builder.Entity(entityType.ClrType)
                .Property<int>("Id")
                .ValueGeneratedOnAdd();

            if (useSqlServerSequenceKeys)
            {
                idPropertyBuilder.HasDefaultValueSql($"NEXT VALUE FOR [{IntKeySequenceName}]");
            }
        }
    }
}
