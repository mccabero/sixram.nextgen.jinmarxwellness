using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Authorization;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Authorization;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/customers")]
public class CustomersController : ApiControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [RequirePermission(ApplicationPermissions.Customers.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<CustomerDto>>>> GetCustomers(
        [FromQuery] bool activeOnly,
        CancellationToken cancellationToken)
    {
        var customers = await _customerService.GetAllAsync(activeOnly, cancellationToken);
        return Success(customers);
    }

    [HttpGet("{id:int}")]
    [RequirePermission(ApplicationPermissions.Customers.View)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> GetCustomer(
        int id,
        CancellationToken cancellationToken)
    {
        var customer = await _customerService.GetByIdAsync(id, cancellationToken);

        if (customer is null)
        {
            return NotFound(ApiResponse.Error<object>(
                "Customer was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(customer);
    }

    [HttpPost]
    [RequirePermission(ApplicationPermissions.Customers.Manage)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> CreateCustomer(
        [FromBody] CreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateAsync(request, cancellationToken);
        var customer = result.Customer!;

        return CreatedAtAction(
            nameof(GetCustomer),
            new { id = customer.Id },
            ApiResponse.Success(customer, "Customer created successfully.", HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:int}")]
    [RequirePermission(ApplicationPermissions.Customers.Manage)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> UpdateCustomer(
        int id,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAsync(id, request, cancellationToken);

        if (result.Status == CustomerMutationStatus.CustomerNotFound)
        {
            return NotFound(ApiResponse.Error<object>(
                "Customer was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return Success(result.Customer!, "Customer updated successfully.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission(ApplicationPermissions.Customers.Manage)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCustomer(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _customerService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse.Error<object>(
                "Customer was not found.",
                traceId: HttpContext.TraceIdentifier));
        }

        return SuccessMessage("Customer deleted successfully.");
    }
}
