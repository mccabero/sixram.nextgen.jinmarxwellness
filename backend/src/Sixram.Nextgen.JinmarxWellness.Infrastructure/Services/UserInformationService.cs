using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Users.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class UserInformationService : IUserInformationService
{
    private const string TherapistRoleName = "Therapist";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;

    public UserInformationService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IDateTimeProvider dateTimeProvider,
        IPasswordHasher<ApplicationUser> passwordHasher)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dateTimeProvider = dateTimeProvider;
        _passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyCollection<UserInformationDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .ThenBy(x => x.UserName)
            .ToListAsync(cancellationToken);

        var result = new List<UserInformationDto>();
        foreach (var user in users)
        {
            result.Add(await ToDtoAsync(user));
        }

        return result;
    }

    public async Task<UserInformationDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return user is null ? null : await ToDtoAsync(user);
    }

    public async Task<UserInformationMutationResult> CreateAsync(
        CreateUserInformationRequest request,
        CancellationToken cancellationToken = default)
    {
        var firstName = NormalizeRequired(request.FirstName);
        var lastName = NormalizeRequired(request.LastName);
        var email = NormalizeRequired(request.Email);
        var userName = NormalizeRequired(request.UserName);
        var phoneNumber = NormalizeOptional(request.PhoneNumber);
        var role = NormalizeRequired(request.Role);
        var pin = NormalizeOptional(request.Pin);

        if (!await _roleManager.RoleExistsAsync(role))
        {
            return UserInformationMutationResult.RoleNotFound();
        }

        if (await UserNameExistsAsync(userName, excludedUserId: null, cancellationToken))
        {
            return UserInformationMutationResult.DuplicateUserName();
        }

        if (await EmailExistsAsync(email, excludedUserId: null, cancellationToken))
        {
            return UserInformationMutationResult.DuplicateEmail();
        }

        var user = new ApplicationUser
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            UserName = userName,
            PhoneNumber = phoneNumber,
            EmailConfirmed = true,
            IsActive = request.IsActive,
            CreatedAt = _dateTimeProvider.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(pin))
        {
            user.PinHash = _passwordHasher.HashPassword(user, pin);
        }

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return UserInformationMutationResult.IdentityError(
                createResult.Errors.Select(error => error.Description));
        }

        var roleResult = await SyncRolesAsync(user, role, request.IsTherapist);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return UserInformationMutationResult.IdentityError(
                roleResult.Errors.Select(error => error.Description));
        }

        return UserInformationMutationResult.Success(await ToDtoAsync(user));
    }

    public async Task<UserInformationMutationResult> UpdateAsync(
        int id,
        UpdateUserInformationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (user is null)
        {
            return UserInformationMutationResult.UserNotFound();
        }

        var firstName = NormalizeRequired(request.FirstName);
        var lastName = NormalizeRequired(request.LastName);
        var email = NormalizeRequired(request.Email);
        var userName = NormalizeRequired(request.UserName);
        var phoneNumber = NormalizeOptional(request.PhoneNumber);
        var role = NormalizeRequired(request.Role);

        if (!await _roleManager.RoleExistsAsync(role))
        {
            return UserInformationMutationResult.RoleNotFound();
        }

        if (await UserNameExistsAsync(userName, excludedUserId: user.Id, cancellationToken))
        {
            return UserInformationMutationResult.DuplicateUserName();
        }

        if (await EmailExistsAsync(email, excludedUserId: user.Id, cancellationToken))
        {
            return UserInformationMutationResult.DuplicateEmail();
        }

        user.FirstName = firstName;
        user.LastName = lastName;
        user.Email = email;
        user.NormalizedEmail = _userManager.NormalizeEmail(email);
        user.UserName = userName;
        user.NormalizedUserName = _userManager.NormalizeName(userName);
        user.PhoneNumber = phoneNumber;
        user.IsActive = request.IsActive;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return UserInformationMutationResult.IdentityError(
                updateResult.Errors.Select(error => error.Description));
        }

        var roleResult = await SyncRolesAsync(user, role, request.IsTherapist);
        if (!roleResult.Succeeded)
        {
            return UserInformationMutationResult.IdentityError(
                roleResult.Errors.Select(error => error.Description));
        }

        return UserInformationMutationResult.Success(await ToDtoAsync(user));
    }

    private async Task<IdentityResult> SyncRolesAsync(
        ApplicationUser user,
        string role,
        bool isTherapist)
    {
        var requestedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            role
        };

        if (isTherapist || string.Equals(role, TherapistRoleName, StringComparison.OrdinalIgnoreCase))
        {
            requestedRoles.Add(TherapistRoleName);
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles
            .Where(currentRole => !requestedRoles.Contains(currentRole))
            .ToArray();
        var rolesToAdd = requestedRoles
            .Where(requestedRole => !currentRoles.Contains(requestedRole, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (rolesToRemove.Length > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                return removeResult;
            }
        }

        return rolesToAdd.Length > 0
            ? await _userManager.AddToRolesAsync(user, rolesToAdd)
            : IdentityResult.Success;
    }

    private Task<bool> UserNameExistsAsync(
        string userName,
        int? excludedUserId,
        CancellationToken cancellationToken)
    {
        var normalizedUserName = _userManager.NormalizeName(userName);

        return _userManager.Users.AnyAsync(
            x => (!excludedUserId.HasValue || x.Id != excludedUserId.Value)
                && x.NormalizedUserName == normalizedUserName,
            cancellationToken);
    }

    private Task<bool> EmailExistsAsync(
        string email,
        int? excludedUserId,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = _userManager.NormalizeEmail(email);

        return _userManager.Users.AnyAsync(
            x => (!excludedUserId.HasValue || x.Id != excludedUserId.Value)
                && x.NormalizedEmail == normalizedEmail,
            cancellationToken);
    }

    private async Task<UserInformationDto> ToDtoAsync(ApplicationUser user)
    {
        var roles = (await _userManager.GetRolesAsync(user))
            .OrderBy(role => role, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var isTherapist = roles.Contains(TherapistRoleName, StringComparer.OrdinalIgnoreCase);
        var primaryRole = roles
            .FirstOrDefault(role => !string.Equals(role, TherapistRoleName, StringComparison.OrdinalIgnoreCase))
            ?? roles.FirstOrDefault()
            ?? string.Empty;

        return new UserInformationDto
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Role = primaryRole,
            Roles = roles,
            IsTherapist = isTherapist,
            IsActive = user.IsActive,
            HasPinConfigured = !string.IsNullOrWhiteSpace(user.PinHash),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    private static string NormalizeRequired(string value) => value.Trim();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
