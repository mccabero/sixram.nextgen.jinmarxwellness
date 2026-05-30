using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.CompanyInformation.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/company-information")]
public class CompanyInformationController : ApiControllerBase
{
    private readonly ICompanyInformationService _companyInformationService;

    public CompanyInformationController(ICompanyInformationService companyInformationService)
    {
        _companyInformationService = companyInformationService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.CompanyInformation.View)]
    [ProducesResponseType(typeof(ApiResponse<CompanyInformationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CompanyInformationDto>>> GetCompanyInformation(
        CancellationToken cancellationToken)
    {
        var companyInformation = await _companyInformationService.GetAsync(cancellationToken);
        return Success(companyInformation);
    }

    [HttpPut]
    [RequirePermission(ApplicationPermissions.CompanyInformation.Update)]
    [ProducesResponseType(typeof(ApiResponse<CompanyInformationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CompanyInformationDto>>> UpdateCompanyInformation(
        [FromBody] UpdateCompanyInformationRequest request,
        CancellationToken cancellationToken)
    {
        var companyInformation = await _companyInformationService.UpdateAsync(request, cancellationToken);
        return Success(companyInformation, "Company information updated successfully.");
    }
}
