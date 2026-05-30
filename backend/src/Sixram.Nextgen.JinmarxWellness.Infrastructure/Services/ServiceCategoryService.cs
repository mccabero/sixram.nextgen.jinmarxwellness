using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class ServiceCategoryService : IServiceCategoryService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUserService _currentUserService;

    public ServiceCategoryService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<ServiceCategoryDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.ServiceCategories
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new ServiceCategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                ServiceCount = x.ServiceOfferings.Count,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ServiceCategoryDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var serviceCategory = await _dbContext.ServiceCategories
            .AsNoTracking()
            .Include(x => x.ServiceOfferings)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return serviceCategory is null ? null : MapToDto(serviceCategory);
    }

    public async Task<ServiceCategoryMutationResult> CreateAsync(
        CreateServiceCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = NormalizeRequired(request.Name);

        if (await ExistsByNameAsync(name, excludedId: null, cancellationToken))
        {
            return ServiceCategoryMutationResult.DuplicateName();
        }

        var serviceCategory = new ServiceCategory
        {
            Name = name,
            Description = NormalizeOptional(request.Description),
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = _currentUserService.UserId
        };

        _dbContext.ServiceCategories.Add(serviceCategory);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceCategoryMutationResult.Success(MapToDto(serviceCategory));
    }

    public async Task<ServiceCategoryMutationResult> UpdateAsync(
        int id,
        UpdateServiceCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceCategory = await _dbContext.ServiceCategories
            .Include(x => x.ServiceOfferings)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (serviceCategory is null)
        {
            return ServiceCategoryMutationResult.NotFound();
        }

        var name = NormalizeRequired(request.Name);

        if (await ExistsByNameAsync(name, id, cancellationToken))
        {
            return ServiceCategoryMutationResult.DuplicateName();
        }

        serviceCategory.Name = name;
        serviceCategory.Description = NormalizeOptional(request.Description);
        serviceCategory.LastModifiedAt = _dateTimeProvider.UtcNow;
        serviceCategory.LastModifiedByUserId = _currentUserService.UserId;

        foreach (var serviceOffering in serviceCategory.ServiceOfferings)
        {
            serviceOffering.Category = name;
            serviceOffering.LastModifiedAt = serviceCategory.LastModifiedAt;
            serviceOffering.LastModifiedByUserId = _currentUserService.UserId;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceCategoryMutationResult.Success(MapToDto(serviceCategory));
    }

    public async Task<ServiceCategoryDeleteResult> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var serviceCategory = await _dbContext.ServiceCategories
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (serviceCategory is null)
        {
            return ServiceCategoryDeleteResult.NotFound;
        }

        var isInUse = await _dbContext.ServiceOfferings
            .AnyAsync(x => x.ServiceCategoryId == id, cancellationToken);

        if (isInUse)
        {
            return ServiceCategoryDeleteResult.InUse;
        }

        _dbContext.ServiceCategories.Remove(serviceCategory);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceCategoryDeleteResult.Deleted;
    }

    private Task<bool> ExistsByNameAsync(
        string name,
        int? excludedId,
        CancellationToken cancellationToken)
    {
        return _dbContext.ServiceCategories
            .AnyAsync(
                x => x.Name == name && (!excludedId.HasValue || x.Id != excludedId.Value),
                cancellationToken);
    }

    private static ServiceCategoryDto MapToDto(ServiceCategory serviceCategory)
    {
        return new ServiceCategoryDto
        {
            Id = serviceCategory.Id,
            Name = serviceCategory.Name,
            Description = serviceCategory.Description,
            ServiceCount = serviceCategory.ServiceOfferings.Count,
            CreatedAt = serviceCategory.CreatedAt,
            LastModifiedAt = serviceCategory.LastModifiedAt
        };
    }

    private static string NormalizeRequired(string value) => value.Trim();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
