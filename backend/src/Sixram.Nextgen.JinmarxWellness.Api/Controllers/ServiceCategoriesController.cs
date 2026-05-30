using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/service-categories")]
public class ServiceCategoriesController : ApiControllerBase
{
    private readonly IServiceCategoryService _serviceCategoryService;

    public ServiceCategoriesController(IServiceCategoryService serviceCategoryService)
    {
        _serviceCategoryService = serviceCategoryService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.ServiceCategories.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<ServiceCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<ServiceCategoryDto>>>> GetServiceCategories(
        CancellationToken cancellationToken)
    {
        var serviceCategories = await _serviceCategoryService.GetAllAsync(cancellationToken);
        return Success(serviceCategories);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceCategories.View)]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ServiceCategoryDto>>> GetServiceCategory(
        int id,
        CancellationToken cancellationToken)
    {
        var serviceCategory = await _serviceCategoryService.GetByIdAsync(id, cancellationToken);

        if (serviceCategory is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Service category was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(serviceCategory);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.ServiceCategories.Create)]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ServiceCategoryDto>>> CreateServiceCategory(
        [FromBody] CreateServiceCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _serviceCategoryService.CreateAsync(request, cancellationToken);

        if (result.Status == ServiceCategoryMutationStatus.DuplicateName)
        {
            return Conflict(ApiResponse.Error<object>(
                "A service category with this name already exists.",
                traceId: HttpContext.TraceIdentifier));
        }

        var serviceCategory = result.ServiceCategory!;

        return CreatedAtAction(
            nameof(GetServiceCategory),
            new { id = serviceCategory.Id },
            ApiResponse.Success(serviceCategory, "Service category created successfully.", HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceCategories.Update)]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ServiceCategoryDto>>> UpdateServiceCategory(
        int id,
        [FromBody] UpdateServiceCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _serviceCategoryService.UpdateAsync(id, request, cancellationToken);

        if (result.Status == ServiceCategoryMutationStatus.NotFound)
        {
            return NotFound(ApiResponse.Error<object>(
                "Service category was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        if (result.Status == ServiceCategoryMutationStatus.DuplicateName)
        {
            return Conflict(ApiResponse.Error<object>(
                "A service category with this name already exists.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(result.ServiceCategory!, "Service category updated successfully.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(ApplicationPermissions.ServiceCategories.Delete)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteServiceCategory(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await _serviceCategoryService.DeleteAsync(id, cancellationToken);

        return result switch
        {
            ServiceCategoryDeleteResult.Deleted => SuccessMessage("Service category deleted successfully."),
            ServiceCategoryDeleteResult.InUse => Conflict(ApiResponse.Error<object>(
                "This service category is assigned to one or more services.",
                traceId: HttpContext.TraceIdentifier)),
            _ => NotFound(ApiResponse.Error<object>(
                "Service category was not found.",
                traceId: HttpContext.TraceIdentifier))
        };
    }
}
