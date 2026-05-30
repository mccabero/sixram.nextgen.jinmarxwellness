using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class CompanyInformationService : ICompanyInformationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;

    public CompanyInformationService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<CompanyInformationDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var requestedKeys = new[]
        {
            CompanyInformationSettingKeys.CompanyName,
            CompanyInformationSettingKeys.Tagline,
            CompanyInformationSettingKeys.CompanyAddress,
            CompanyInformationSettingKeys.GCashAccounts,
            CompanyInformationSettingKeys.BankAccounts
        };

        var settings = await _dbContext.SystemSettings
            .AsNoTracking()
            .Where(x => requestedKeys.Contains(x.Key))
            .ToDictionaryAsync(
                x => x.Key,
                x => x.Value,
                StringComparer.OrdinalIgnoreCase,
                cancellationToken);

        return new CompanyInformationDto
        {
            CompanyName = GetValue(settings, CompanyInformationSettingKeys.CompanyName, "Jinmarx Wellness"),
            Tagline = NormalizeOptional(settings.GetValueOrDefault(CompanyInformationSettingKeys.Tagline)),
            CompanyAddress = NormalizeOptional(settings.GetValueOrDefault(CompanyInformationSettingKeys.CompanyAddress)),
            GCashNumbers = ParseAccounts<CompanyAccountDto>(settings.GetValueOrDefault(CompanyInformationSettingKeys.GCashAccounts)),
            BankAccounts = ParseAccounts<BankAccountDto>(settings.GetValueOrDefault(CompanyInformationSettingKeys.BankAccounts))
        };
    }

    public async Task<CompanyInformationDto> UpdateAsync(
        UpdateCompanyInformationRequest request,
        CancellationToken cancellationToken = default)
    {
        await UpsertSettingAsync(
            CompanyInformationSettingKeys.CompanyName,
            request.CompanyName.Trim(),
            "Company Information",
            "Primary company name used across the application.",
            cancellationToken);
        await UpsertSettingAsync(
            CompanyInformationSettingKeys.Tagline,
            NormalizeOptional(request.Tagline),
            "Company Information",
            "Short company tagline used in branding and supporting materials.",
            cancellationToken);
        await UpsertSettingAsync(
            CompanyInformationSettingKeys.CompanyAddress,
            NormalizeOptional(request.CompanyAddress),
            "Company Information",
            "Primary business address.",
            cancellationToken);
        await UpsertSettingAsync(
            CompanyInformationSettingKeys.GCashAccounts,
            JsonSerializer.Serialize(request.GCashNumbers, JsonOptions),
            "Company Information",
            "Configured GCash collection accounts.",
            cancellationToken);
        await UpsertSettingAsync(
            CompanyInformationSettingKeys.BankAccounts,
            JsonSerializer.Serialize(request.BankAccounts, JsonOptions),
            "Company Information",
            "Configured bank collection accounts.",
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetAsync(cancellationToken);
    }

    private async Task UpsertSettingAsync(
        string key,
        string? value,
        string group,
        string description,
        CancellationToken cancellationToken)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(
            x => x.Key == key,
            cancellationToken);

        if (setting is null)
        {
            _dbContext.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = value,
                Group = group,
                Description = description,
                IsEncrypted = false,
                CreatedAt = _dateTimeProvider.UtcNow
            });

            return;
        }

        setting.Value = value;
        setting.Group = group;
        setting.Description = description;
        setting.LastModifiedAt = _dateTimeProvider.UtcNow;
    }

    private static string GetValue(
        IReadOnlyDictionary<string, string?> settings,
        string key,
        string fallback)
    {
        var value = settings.GetValueOrDefault(key);
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }

    private static IReadOnlyCollection<TAccount> ParseAccounts<TAccount>(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<TAccount>>(value, JsonOptions)
                ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
