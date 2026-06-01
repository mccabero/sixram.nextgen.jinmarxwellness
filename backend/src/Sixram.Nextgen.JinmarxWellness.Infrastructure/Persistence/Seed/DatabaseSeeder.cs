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
        var now = _dateTimeProvider.UtcNow;
        var defaults = new[]
        {
            ServiceOfferingSeed("Pure Thai Massage", "Premium Package", 599, "Skilled massage techniques to experience."),
            ServiceOfferingSeed("Swedish & Shiatsu Combination", "Premium Package", 399, "Relax and indulge tired and stressed achy muscles.", legacyNames: ["Swedish Massage"]),
            ServiceOfferingSeed("Whole Body Combination", "Premium Package", 499, "A classic massage experience performed with expertise.", "+ free ventosa or hot stone"),
            ServiceOfferingSeed("Foot Spa", "Specialized Therapy", 299, "Soothes tired feet and improves circulation."),
            ServiceOfferingSeed("Foot Reflexology", "Specialized Therapy", 399, "Relieves stress and promotes overall well-being.", "+ foot spa", 249),
            ServiceOfferingSeed("Frozen Shoulder", "Additional Services", null),
            ServiceOfferingSeed("Guasa", "Additional Services", null),
            ServiceOfferingSeed("Slimpack", "Additional Services", null),
            ServiceOfferingSeed("Sccooa", "Additional Services", null, legacyNames: ["Scocoa"]),
            ServiceOfferingSeed("Luluran", "Additional Services", null),
            ServiceOfferingSeed("Ayurvedic", "Additional Services", null),
            ServiceOfferingSeed("Tapalodo", "Additional Services", null),
            ServiceOfferingSeed("Socolase", "Additional Services", null),
            ServiceOfferingSeed("Padastri", "Additional Services", null),
            ServiceOfferingSeed("Massage", "Additional Services", null),
            ServiceOfferingSeed("Traditional Massage", "Additional Services", null),
            ServiceOfferingSeed("Relaxation Massage", "Full Body Massage", 349),
            ServiceOfferingSeed("Athlete Massage", "Full Body Massage", 449),
            ServiceOfferingSeed("Aromatherapy Massage", "Full Body Massage", 399),
            ServiceOfferingSeed("Ventosa Therapy", "Full Body Massage", 499),
            ServiceOfferingSeed("Body Scrub with Wet/Dry (Hot Massage)", "Full Body Massage", 699, legacyNames: ["Body Scrub with Wet/dry (Hot Massage)"]),
            ServiceOfferingSeed("Paraffin Wax Massage", "Full Body Massage", 599),
            ServiceOfferingSeed("Jinmarx' Signature Massage with Bone Setting", "Full Body Massage", 799),
            ServiceOfferingSeed("Whole Body Massage", "Home Services", 699, durationMinutes: 90, isHomeService: true),
            ServiceOfferingSeed("Whole Body Massage", "Home Services", 799, durationMinutes: 120, isHomeService: true),
            ServiceOfferingSeed("Whole Body Massage with Ventosa or Hot Stone", "Home Services", 899, durationMinutes: 120, isHomeService: true, legacyNames: ["Whole Body Massage with Ventosa"])
        };

        var categoryLookup = await _dbContext.ServiceCategories
            .ToDictionaryAsync(x => x.Name, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var existingOfferings = await _dbContext.ServiceOfferings
            .Include(x => x.ServiceCategory)
            .ToListAsync(cancellationToken);
        var serviceOfferingsToAdd = new List<ServiceOffering>();
        var hasUpdates = false;

        foreach (var item in defaults)
        {
            if (!categoryLookup.TryGetValue(item.Category, out var serviceCategory))
            {
                throw new InvalidOperationException($"Unable to seed service offering '{item.Name}' because category '{item.Category}' was not found.");
            }

            var existing = existingOfferings.FirstOrDefault(serviceOffering =>
                IsSameDefaultServiceOffering(serviceOffering, item));

            if (existing is null)
            {
                var newServiceOffering = CreateDefaultServiceOffering(item, serviceCategory, now);
                serviceOfferingsToAdd.Add(newServiceOffering);
                existingOfferings.Add(newServiceOffering);
                continue;
            }

            hasUpdates |= ApplyDefaultServiceOfferingValues(existing, item, serviceCategory, now);
        }

        if (serviceOfferingsToAdd.Count > 0)
        {
            _dbContext.ServiceOfferings.AddRange(serviceOfferingsToAdd);
        }

        if (serviceOfferingsToAdd.Count > 0 || hasUpdates)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static DefaultServiceOffering ServiceOfferingSeed(
        string name,
        string category,
        decimal? price,
        string? description = null,
        string? addOnDetails = null,
        decimal? addOnRate = null,
        int? durationMinutes = null,
        bool isHomeService = false,
        string[]? legacyNames = null) =>
        new(name, category, price, description, addOnDetails, addOnRate, durationMinutes, isHomeService, legacyNames ?? []);

    private static ServiceOffering CreateDefaultServiceOffering(
        DefaultServiceOffering item,
        ServiceCategory serviceCategory,
        DateTimeOffset now) =>
        new()
        {
            Name = item.Name,
            ServiceCategoryId = serviceCategory.Id,
            ServiceCategory = serviceCategory,
            Category = serviceCategory.Name,
            Description = item.Description,
            DurationMinutes = item.DurationMinutes,
            Price = item.Price,
            AddOnDetails = item.AddOnDetails,
            AddOnRate = item.AddOnRate,
            IsHomeService = item.IsHomeService,
            IsActive = true,
            CreatedAt = now
        };

    private static bool IsSameDefaultServiceOffering(
        ServiceOffering serviceOffering,
        DefaultServiceOffering defaultOffering)
    {
        var categoryName = serviceOffering.ServiceCategory?.Name ?? serviceOffering.Category;

        return IsDefaultServiceOfferingNameMatch(serviceOffering, defaultOffering)
            && string.Equals(categoryName, defaultOffering.Category, StringComparison.OrdinalIgnoreCase)
            && serviceOffering.DurationMinutes == defaultOffering.DurationMinutes
            && serviceOffering.IsHomeService == defaultOffering.IsHomeService;
    }

    private static bool ApplyDefaultServiceOfferingValues(
        ServiceOffering serviceOffering,
        DefaultServiceOffering defaultOffering,
        ServiceCategory serviceCategory,
        DateTimeOffset now)
    {
        var hasUpdates = false;
        var shouldSynchronizeDefaults = IsSystemSeededServiceOffering(serviceOffering);

        if (ShouldSetValue(serviceOffering.Name, defaultOffering.Name, shouldSynchronizeDefaults))
        {
            serviceOffering.Name = defaultOffering.Name;
            hasUpdates = true;
        }

        if (serviceOffering.ServiceCategoryId != serviceCategory.Id)
        {
            serviceOffering.ServiceCategoryId = serviceCategory.Id;
            serviceOffering.ServiceCategory = serviceCategory;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.Category, serviceCategory.Name, shouldSynchronizeDefaults))
        {
            serviceOffering.Category = serviceCategory.Name;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.Description, defaultOffering.Description, shouldSynchronizeDefaults))
        {
            serviceOffering.Description = defaultOffering.Description;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.DurationMinutes, defaultOffering.DurationMinutes, shouldSynchronizeDefaults))
        {
            serviceOffering.DurationMinutes = defaultOffering.DurationMinutes;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.Price, defaultOffering.Price, shouldSynchronizeDefaults))
        {
            serviceOffering.Price = defaultOffering.Price;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.AddOnDetails, defaultOffering.AddOnDetails, shouldSynchronizeDefaults))
        {
            serviceOffering.AddOnDetails = defaultOffering.AddOnDetails;
            hasUpdates = true;
        }

        if (ShouldSetValue(serviceOffering.AddOnRate, defaultOffering.AddOnRate, shouldSynchronizeDefaults))
        {
            serviceOffering.AddOnRate = defaultOffering.AddOnRate;
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            serviceOffering.LastModifiedAt = now;
        }

        return hasUpdates;
    }

    private static bool IsDefaultServiceOfferingNameMatch(
        ServiceOffering serviceOffering,
        DefaultServiceOffering defaultOffering) =>
        string.Equals(serviceOffering.Name, defaultOffering.Name, StringComparison.OrdinalIgnoreCase)
            || (IsSystemSeededServiceOffering(serviceOffering)
                && defaultOffering.LegacyNames.Any(legacyName =>
                    string.Equals(serviceOffering.Name, legacyName, StringComparison.OrdinalIgnoreCase)));

    private static bool IsSystemSeededServiceOffering(ServiceOffering serviceOffering) =>
        serviceOffering.CreatedByUserId is null && serviceOffering.LastModifiedByUserId is null;

    private static bool ShouldSetValue(string? currentValue, string? defaultValue, bool shouldSynchronizeDefaults)
    {
        if (shouldSynchronizeDefaults)
        {
            return !string.Equals(currentValue, defaultValue, StringComparison.Ordinal);
        }

        return string.IsNullOrWhiteSpace(currentValue) && !string.IsNullOrWhiteSpace(defaultValue);
    }

    private static bool ShouldSetValue(int? currentValue, int? defaultValue, bool shouldSynchronizeDefaults) =>
        shouldSynchronizeDefaults
            ? currentValue != defaultValue
            : currentValue is null && defaultValue.HasValue;

    private static bool ShouldSetValue(decimal? currentValue, decimal? defaultValue, bool shouldSynchronizeDefaults) =>
        shouldSynchronizeDefaults
            ? currentValue != defaultValue
            : currentValue is null && defaultValue.HasValue;

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
        decimal? AddOnRate,
        int? DurationMinutes,
        bool IsHomeService,
        IReadOnlyCollection<string> LegacyNames);

    private sealed record DefaultServiceCategory(
        string Name,
        string Description);
}
