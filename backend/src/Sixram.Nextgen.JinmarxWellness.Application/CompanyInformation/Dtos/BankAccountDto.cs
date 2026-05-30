namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

public class BankAccountDto
{
    public string BankProvider { get; init; } = string.Empty;
    public string AccountName { get; init; } = string.Empty;
    public string AccountNumber { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
}
