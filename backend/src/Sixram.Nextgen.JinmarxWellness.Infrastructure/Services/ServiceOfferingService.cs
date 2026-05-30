using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class ServiceOfferingService : IServiceOfferingService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUserService _currentUserService;

    public ServiceOfferingService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<ServiceOfferingDto>> GetAllAsync(
        bool activeOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ServiceOfferings.AsNoTracking();

        if (activeOnly)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query
            .OrderBy(x => x.ServiceCategory.Name)
            .ThenBy(x => x.Name)
            .Select(x => new ServiceOfferingDto
            {
                Id = x.Id,
                Name = x.Name,
                ServiceCategoryId = x.ServiceCategoryId,
                Category = x.ServiceCategory.Name,
                Description = x.Description,
                DurationMinutes = x.DurationMinutes,
                Price = x.Price,
                AddOnDetails = x.AddOnDetails,
                AddOnRate = x.AddOnRate,
                IsHomeService = x.IsHomeService,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ServiceOfferingDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var serviceOffering = await _dbContext.ServiceOfferings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return serviceOffering is null ? null : MapToDto(serviceOffering);
    }

    public async Task<ServiceOfferingMutationResult> CreateAsync(
        CreateServiceOfferingRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceCategory = await _dbContext.ServiceCategories
            .FirstOrDefaultAsync(x => x.Id == request.ServiceCategoryId, cancellationToken);

        if (serviceCategory is null)
        {
            return ServiceOfferingMutationResult.ServiceCategoryNotFound();
        }

        var serviceOffering = new ServiceOffering
        {
            Name = NormalizeRequired(request.Name),
            ServiceCategoryId = serviceCategory.Id,
            Category = serviceCategory.Name,
            Description = NormalizeOptional(request.Description),
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            AddOnDetails = NormalizeOptional(request.AddOnDetails),
            AddOnRate = request.AddOnRate,
            IsHomeService = request.IsHomeService,
            IsActive = request.IsActive,
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = _currentUserService.UserId
        };

        _dbContext.ServiceOfferings.Add(serviceOffering);
        await _dbContext.SaveChangesAsync(cancellationToken);

        serviceOffering.ServiceCategory = serviceCategory;
        return ServiceOfferingMutationResult.Success(MapToDto(serviceOffering));
    }

    public async Task<ServiceOfferingMutationResult> UpdateAsync(
        int id,
        UpdateServiceOfferingRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceOffering = await _dbContext.ServiceOfferings
            .Include(x => x.ServiceCategory)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (serviceOffering is null)
        {
            return ServiceOfferingMutationResult.ServiceOfferingNotFound();
        }

        var serviceCategory = await _dbContext.ServiceCategories
            .FirstOrDefaultAsync(x => x.Id == request.ServiceCategoryId, cancellationToken);

        if (serviceCategory is null)
        {
            return ServiceOfferingMutationResult.ServiceCategoryNotFound();
        }

        serviceOffering.Name = NormalizeRequired(request.Name);
        serviceOffering.ServiceCategoryId = serviceCategory.Id;
        serviceOffering.ServiceCategory = serviceCategory;
        serviceOffering.Category = serviceCategory.Name;
        serviceOffering.Description = NormalizeOptional(request.Description);
        serviceOffering.DurationMinutes = request.DurationMinutes;
        serviceOffering.Price = request.Price;
        serviceOffering.AddOnDetails = NormalizeOptional(request.AddOnDetails);
        serviceOffering.AddOnRate = request.AddOnRate;
        serviceOffering.IsHomeService = request.IsHomeService;
        serviceOffering.IsActive = request.IsActive;
        serviceOffering.LastModifiedAt = _dateTimeProvider.UtcNow;
        serviceOffering.LastModifiedByUserId = _currentUserService.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceOfferingMutationResult.Success(MapToDto(serviceOffering));
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var serviceOffering = await _dbContext.ServiceOfferings
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (serviceOffering is null)
        {
            return false;
        }

        _dbContext.ServiceOfferings.Remove(serviceOffering);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static ServiceOfferingDto MapToDto(ServiceOffering serviceOffering)
    {
        return new ServiceOfferingDto
        {
            Id = serviceOffering.Id,
            Name = serviceOffering.Name,
            ServiceCategoryId = serviceOffering.ServiceCategoryId,
            Category = serviceOffering.ServiceCategory?.Name ?? serviceOffering.Category,
            Description = serviceOffering.Description,
            DurationMinutes = serviceOffering.DurationMinutes,
            Price = serviceOffering.Price,
            AddOnDetails = serviceOffering.AddOnDetails,
            AddOnRate = serviceOffering.AddOnRate,
            IsHomeService = serviceOffering.IsHomeService,
            IsActive = serviceOffering.IsActive,
            CreatedAt = serviceOffering.CreatedAt,
            LastModifiedAt = serviceOffering.LastModifiedAt
        };
    }

    private static string NormalizeRequired(string value) => value.Trim();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
