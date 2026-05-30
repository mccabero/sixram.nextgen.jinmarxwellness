using System.Text.Json.Serialization;

namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

public class UpdateCompanyInformationRequest
{
    [JsonPropertyName("companyName")]
    public string CompanyName { get; init; } = string.Empty;

    [JsonPropertyName("tagline")]
    public string? Tagline { get; init; }

    [JsonPropertyName("companyAddress")]
    public string? CompanyAddress { get; init; }

    [JsonPropertyName("gcashNumbers")]
    public IReadOnlyCollection<CompanyAccountDto> GCashNumbers { get; init; } = [];

    [JsonPropertyName("bankAccounts")]
    public IReadOnlyCollection<BankAccountDto> BankAccounts { get; init; } = [];
}
