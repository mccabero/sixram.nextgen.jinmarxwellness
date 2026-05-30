using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Interfaces;

public interface IServiceOfferingService
{
    Task<IReadOnlyCollection<ServiceOfferingDto>> GetAllAsync(
        bool activeOnly = false,
        CancellationToken cancellationToken = default);

    Task<ServiceOfferingDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<ServiceOfferingMutationResult> CreateAsync(
        CreateServiceOfferingRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceOfferingMutationResult> UpdateAsync(
        int id,
        UpdateServiceOfferingRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
