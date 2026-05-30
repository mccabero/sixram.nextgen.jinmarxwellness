namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

public class CompanyAccountDto
{
    public string AccountName { get; init; } = string.Empty;
    public string AccountNumber { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
}
