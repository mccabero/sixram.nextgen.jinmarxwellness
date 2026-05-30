using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Seed;

public class DatabaseSeeder
{
    private static readonly string[] DefaultRoles = ["Admin", "Staff", "Therapist"];

    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly SeedAdminSettings _seedAdminSettings;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher = new();

    public DatabaseSeeder(
        RoleManager<ApplicationRole> roleManager,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        IOptions<SeedAdminSettings> seedAdminSettings,
        IDateTimeProvider dateTimeProvider)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _dbContext = dbContext;
        _seedAdminSettings = seedAdminSettings.Value;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        foreach (var roleName in DefaultRoles)
        {
            if (await _roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await _roleManager.CreateAsync(new ApplicationRole
            {
                Name = roleName,
                Description = $"{roleName} role"
            });

            ThrowIfFailed(result, $"Unable to seed {roleName} role.");
        }

        await SeedDefaultRolePermissionsAsync();

        var admin = await _userManager.FindByEmailAsync(_seedAdminSettings.Email);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = _seedAdminSettings.UserName,
                Email = _seedAdminSettings.Email,
                EmailConfirmed = true,
                FirstName = _seedAdminSettings.FirstName,
                LastName = _seedAdminSettings.LastName,
                CreatedAt = _dateTimeProvider.UtcNow,
                IsActive = true
            };

            admin.PinHash = _passwordHasher.HashPassword(admin, _seedAdminSettings.Pin);

            var createResult = await _userManager.CreateAsync(admin, _seedAdminSettings.Password);
            ThrowIfFailed(createResult, "Unable to seed admin user.");
        }

        if (!await _userManager.IsInRoleAsync(admin, "Admin"))
        {
            var roleResult = await _userManager.AddToRoleAsync(admin, "Admin");
            ThrowIfFailed(roleResult, "Unable to assign admin role.");
        }

        await SeedServiceCategoriesAsync(cancellationToken);
        await SeedServiceOfferingsAsync(cancellationToken);
    }

    private async Task SeedDefaultRolePermissionsAsync()
    {
        await EnsureRolePermissionsAsync(
            "Admin",
            ApplicationPermissions.All.Select(permission => permission.Code));

        await EnsureRolePermissionsAsync(
            "Staff",
            [
                ApplicationPermissions.Dashboard.View,
                ApplicationPermissions.Operations.View,
                ApplicationPermissions.Appointments.View,
                ApplicationPermissions.Appointments.Manage,
                ApplicationPermissions.PointOfSale.View,
                ApplicationPermissions.PointOfSale.Manage,
                ApplicationPermissions.Customers.View,
                ApplicationPermissions.Customers.Manage,
                ApplicationPermissions.Reports.View
            ]);

        await EnsureRolePermissionsAsync(
            "Therapist",
            [
                ApplicationPermissions.Dashboard.View,
                ApplicationPermissions.Operations.View,
                ApplicationPermissions.Appointments.View,
                ApplicationPermissions.PointOfSale.View
            ]);
    }

    private async Task EnsureRolePermissionsAsync(string roleName, IEnumerable<string> permissionCodes)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role is null)
        {
            return;
        }

        var existingCodes = (await _roleManager.GetClaimsAsync(role))
            .Where(claim => claim.Type == ApplicationClaimTypes.Permission)
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var permissionCode in permissionCodes.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (existingCodes.Contains(permissionCode))
            {
                continue;
            }

            var result = await _roleManager.AddClaimAsync(
                role,
                new Claim(ApplicationClaimTypes.Permission, permissionCode));
            ThrowIfFailed(result, $"Unable to seed {roleName} permission.");
        }
    }

    private async Task SeedServiceCategoriesAsync(CancellationToken cancellationToken)
    {
        var now = _dateTimeProvider.UtcNow;
        var defaults = new[]
        {
            new DefaultServiceCategory("Premium Package", "Featured massage packages and curated premium offers."),
            new DefaultServiceCategory("Specialized Therapy", "Focused treatments for targeted relief and recovery."),
            new DefaultServiceCategory("Additional Services", "Supplemental therapies and add-on service options."),
            new DefaultServiceCategory("Full Body Massage", "Core full-body massage services."),
            new DefaultServiceCategory("Home Services", "Services available for home appointments.")
        };

        foreach (var defaultCategory in defaults)
        {
            var exists = await _dbContext.ServiceCategories
                .AnyAsync(x => x.Name == defaultCategory.Name, cancellationToken);

            if (exists)
            {
                continue;
            }

            _dbContext.ServiceCategories.Add(new ServiceCategory
            {
                Name = defaultCategory.Name,
                Description = defaultCategory.Description,
                CreatedAt = now
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedServiceOfferingsAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.ServiceOfferings.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = _dateTimeProvider.UtcNow;
        var defaults = new[]
        {
            ServiceOfferingSeed("Pure Thai Massage", "Premium Package", 600, "Skilled massage techniques to experience.", "+ 1 Hour 550"),
            ServiceOfferingSeed("Swedish Massage", "Premium Package", 450, "Relax and indulge tired and stressed achy muscles.", "+ free hotstone"),
            ServiceOfferingSeed("Whole Body Combination", "Premium Package", 550, "A classic massage experience performed with expertise.", "+ free ventosa or hotstone; + 30mins 250"),
            ServiceOfferingSeed("Foot Reflexology", "Specialized Therapy", 550, "Relieves stress and promotes overall well-being.", "+ Foot Scrub 300"),
            ServiceOfferingSeed("Frozen Shoulder", "Additional Services", null),
            ServiceOfferingSeed("Guasa", "Additional Services", null),
            ServiceOfferingSeed("Slimpack", "Additional Services", null),
            ServiceOfferingSeed("Scocoa", "Additional Services", null),
            ServiceOfferingSeed("Luluran", "Additional Services", null),
            ServiceOfferingSeed("Ayurvedic", "Additional Services", null),
            ServiceOfferingSeed("Tapalodo", "Additional Services", null),
            ServiceOfferingSeed("Socolase", "Additional Services", null),
            ServiceOfferingSeed("Padastri", "Additional Services", null),
            ServiceOfferingSeed("Massage", "Additional Services", null),
            ServiceOfferingSeed("Traditional Massage", "Additional Services", null),
            ServiceOfferingSeed("Relaxation Massage", "Full Body Massage", 400),
            ServiceOfferingSeed("Athlete Massage", "Full Body Massage", 450),
            ServiceOfferingSeed("Body Scrub with Wet/dry (Hot Massage)", "Full Body Massage", 850),
            ServiceOfferingSeed("Jinmarx' Signature Massage with Bone Setting", "Full Body Massage", 1200),
            ServiceOfferingSeed("Ventosa Therapy", "Full Body Massage", 550),
            ServiceOfferingSeed("Aromatherapy Massage", "Full Body Massage", 450),
            ServiceOfferingSeed("Paraffin Wax Massage", "Full Body Massage", 800),
            ServiceOfferingSeed("Whole Body Massage with Sauna", "Full Body Massage", 850),
            ServiceOfferingSeed("Whole Body Massage", "Home Services", 800, durationMinutes: 90, isHomeService: true),
            ServiceOfferingSeed("Whole Body Massage", "Home Services", 1000, durationMinutes: 120, isHomeService: true),
            ServiceOfferingSeed("Whole Body Massage with Ventosa", "Home Services", 1150, durationMinutes: 120, isHomeService: true)
        };

        var categoryLookup = await _dbContext.ServiceCategories
            .ToDictionaryAsync(x => x.Name, StringComparer.OrdinalIgnoreCase, cancellationToken);

        _dbContext.ServiceOfferings.AddRange(defaults.Select(item =>
        {
            var serviceCategory = categoryLookup[item.Category];

            return new ServiceOffering
            {
                Name = item.Name,
                ServiceCategoryId = serviceCategory.Id,
                Category = serviceCategory.Name,
                Description = item.Description,
                DurationMinutes = item.DurationMinutes,
                Price = item.Price,
                AddOnDetails = item.AddOnDetails,
                IsHomeService = item.IsHomeService,
                IsActive = true,
                CreatedAt = now
            };
        }));

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static DefaultServiceOffering ServiceOfferingSeed(
        string name,
        string category,
        decimal? price,
        string? description = null,
        string? addOnDetails = null,
        int? durationMinutes = null,
        bool isHomeService = false) =>
        new(name, category, price, description, addOnDetails, durationMinutes, isHomeService);

    private static void ThrowIfFailed(IdentityResult result, string message)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(" ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"{message} {errors}");
    }

    private sealed record DefaultServiceOffering(
        string Name,
        string Category,
        decimal? Price,
        string? Description,
        string? AddOnDetails,
        int? DurationMinutes,
        bool IsHomeService);

    private sealed record DefaultServiceCategory(
        string Name,
        string Description);
}
