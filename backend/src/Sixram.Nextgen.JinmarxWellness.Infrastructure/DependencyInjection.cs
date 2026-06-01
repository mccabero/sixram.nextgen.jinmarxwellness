using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Bookings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Settings;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Rbac.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authentication;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Seed;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<CookieSettings>(configuration.GetSection("CookieSettings"));
        services.Configure<SeedAdminSettings>(configuration.GetSection("SeedAdmin"));

        services.AddScoped<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
        if (string.IsNullOrWhiteSpace(jwtSettings.SigningKey))
        {
            jwtSettings.SigningKey = "REPLACE_WITH_STRONG_LOCAL_DEV_SECRET_AT_LEAST_32_CHARS";
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey));

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = signingKey,
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrWhiteSpace(context.Token))
                        {
                            context.Token = context.Request.Cookies["jinmarx_access_token"];
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddHttpContextAccessor();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<ICompanyInformationService, CompanyInformationService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IServiceCategoryService, ServiceCategoryService>();
        services.AddScoped<IServiceOfferingService, ServiceOfferingService>();
        services.AddScoped<ICameraEventService, CameraEventService>();
        services.AddScoped<IRbacService, RbacService>();
        services.AddScoped<IUserInformationService, UserInformationService>();
        services.AddScoped<DatabaseSeeder>();

        return services;
    }

    public static async Task ApplyDatabaseMigrationsAsync(this IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public static async Task SeedDatabaseAsync(this IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
    {
        using var scope = serviceProvider.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync(cancellationToken);
    }
}
