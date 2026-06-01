using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Customers.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUserService _currentUserService;

    public CustomerService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<CustomerDto>> GetAllAsync(
        bool activeOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Customers.AsNoTracking();

        if (activeOnly)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query
            .OrderBy(x => x.Name)
            .Select(x => new CustomerDto
            {
                Id = x.Id,
                Name = x.Name,
                PhoneNumber = x.PhoneNumber,
                Email = x.Email,
                Notes = x.Notes,
                VisitCount = x.VisitCount,
                LastVisitAt = x.LastVisitAt,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return customer is null ? null : MapToDto(customer);
    }

    public async Task<CustomerMutationResult> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken cancellationToken = default)
    {
        var customer = new Customer
        {
            Name = NormalizeRequired(request.Name),
            PhoneNumber = NormalizeRequired(request.PhoneNumber),
            Email = NormalizeOptional(request.Email),
            Notes = NormalizeOptional(request.Notes),
            VisitCount = request.VisitCount,
            LastVisitAt = request.LastVisitAt,
            IsActive = request.IsActive,
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = _currentUserService.UserId
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CustomerMutationResult.Success(MapToDto(customer));
    }

    public async Task<CustomerMutationResult> UpdateAsync(
        int id,
        UpdateCustomerRequest request,
        CancellationToken cancellationToken = default)
    {
        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (customer is null)
        {
            return CustomerMutationResult.CustomerNotFound();
        }

        customer.Name = NormalizeRequired(request.Name);
        customer.PhoneNumber = NormalizeRequired(request.PhoneNumber);
        customer.Email = NormalizeOptional(request.Email);
        customer.Notes = NormalizeOptional(request.Notes);
        customer.VisitCount = request.VisitCount;
        customer.LastVisitAt = request.LastVisitAt;
        customer.IsActive = request.IsActive;
        customer.LastModifiedAt = _dateTimeProvider.UtcNow;
        customer.LastModifiedByUserId = _currentUserService.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return CustomerMutationResult.Success(MapToDto(customer));
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (customer is null)
        {
            return false;
        }

        _dbContext.Customers.Remove(customer);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            PhoneNumber = customer.PhoneNumber,
            Email = customer.Email,
            Notes = customer.Notes,
            VisitCount = customer.VisitCount,
            LastVisitAt = customer.LastVisitAt,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            LastModifiedAt = customer.LastModifiedAt
        };
    }

    private static string NormalizeRequired(string value) => value.Trim();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
