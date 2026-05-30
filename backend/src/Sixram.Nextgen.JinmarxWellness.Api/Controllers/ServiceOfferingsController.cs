using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/service-offerings")]
public class ServiceOfferingsController : ApiControllerBase
{
    private readonly IServiceOfferingService _serviceOfferingService;

    public ServiceOfferingsController(IServiceOfferingService serviceOfferingService)
    {
        _serviceOfferingService = serviceOfferingService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.ServiceOfferings.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<ServiceOfferingDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<ServiceOfferingDto>>>> GetServiceOfferings(
        [FromQuery] bool activeOnly,
        CancellationToken cancellationToken)
    {
        var serviceOfferings = await _serviceOfferingService.GetAllAsync(activeOnly, cancellationToken);
        return Success(serviceOfferings);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceOfferings.View)]
    [ProducesResponseType(typeof(ApiResponse<ServiceOfferingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> GetServiceOffering(
        int id,
        CancellationToken cancellationToken)
    {
        var serviceOffering = await _serviceOfferingService.GetByIdAsync(id, cancellationToken);

        if (serviceOffering is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Service offering was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(serviceOffering);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.ServiceOfferings.Create)]
    [ProducesResponseType(typeof(ApiResponse<ServiceOfferingDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> CreateServiceOffering(
        [FromBody] CreateServiceOfferingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _serviceOfferingService.CreateAsync(request, cancellationToken);

        if (result.Status == ServiceOfferingMutationStatus.ServiceCategoryNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected service category was not found."],
                HttpContext.TraceIdentifier));
        }

        var serviceOffering = result.ServiceOffering!;

        return CreatedAtAction(
            nameof(GetServiceOffering),
            new { id = serviceOffering.Id },
            ApiResponse.Success(serviceOffering, "Service offering created successfully.", HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceOfferings.Update)]
    [ProducesResponseType(typeof(ApiResponse<ServiceOfferingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> UpdateServiceOffering(
        int id,
        [FromBody] UpdateServiceOfferingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _serviceOfferingService.UpdateAsync(id, request, cancellationToken);

        if (result.Status == ServiceOfferingMutationStatus.ServiceOfferingNotFound)
        {
            return NotFound(ApiResponse.Error<object>(
                "Service offering was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        if (result.Status == ServiceOfferingMutationStatus.ServiceCategoryNotFound)
        {
            return BadRequest(ApiResponse.ValidationError(
                ["Selected service category was not found."],
                HttpContext.TraceIdentifier));
        }

        return Success(result.ServiceOffering!, "Service offering updated successfully.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceOfferings.Delete)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteServiceOffering(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _serviceOfferingService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse.Error<object>(
                "Service offering was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Service offering deleted successfully.");
    }
}
