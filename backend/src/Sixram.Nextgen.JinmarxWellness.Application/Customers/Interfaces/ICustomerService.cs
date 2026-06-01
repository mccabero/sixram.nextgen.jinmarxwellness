using Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Interfaces;

public interface ICustomerService
{
    Task<IReadOnlyCollection<CustomerDto>> GetAllAsync(
        bool activeOnly = false,
        CancellationToken cancellationToken = default);

    Task<CustomerDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<CustomerMutationResult> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken cancellationToken = default);

    Task<CustomerMutationResult> UpdateAsync(
        int id,
        UpdateCustomerRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
