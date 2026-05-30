using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Interfaces;

public interface IServiceCategoryService
{
    Task<IReadOnlyCollection<ServiceCategoryDto>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<ServiceCategoryDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<ServiceCategoryMutationResult> CreateAsync(
        CreateServiceCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceCategoryMutationResult> UpdateAsync(
        int id,
        UpdateServiceCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceCategoryDeleteResult> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
