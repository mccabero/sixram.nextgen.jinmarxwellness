using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Interfaces;

public interface ICompanyInformationService
{
    Task<CompanyInformationDto> GetAsync(CancellationToken cancellationToken = default);

    Task<CompanyInformationDto> UpdateAsync(
        UpdateCompanyInformationRequest request,
        CancellationToken cancellationToken = default);
}
