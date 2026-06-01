using Microsoft.EntityFrameworkCore;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ICurrentUserService _currentUserService;

    public AppointmentService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyCollection<AppointmentDto>> GetAllAsync(
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Appointments.AsNoTracking();

        if (from.HasValue)
        {
            query = query.Where(x => x.ScheduledAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(x => x.ScheduledAt < to.Value);
        }

        return await query
            .OrderBy(x => x.ScheduledAt)
            .Select(x => new AppointmentDto
            {
                Id = x.Id,
                CustomerName = x.CustomerName,
                PhoneNumber = x.PhoneNumber,
                ServiceOfferingId = x.ServiceOfferingId,
                ServiceName = x.ServiceName,
                ServicePrice = x.ServicePrice,
                ScheduledAt = x.ScheduledAt,
                Status = x.Status,
                Notes = x.Notes,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AppointmentDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return appointment is null ? null : MapToDto(appointment);
    }

    public async Task<AppointmentMutationResult> CreateAsync(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceOffering = await GetServiceOfferingAsync(
            request.ServiceOfferingId,
            cancellationToken);

        if (serviceOffering is null)
        {
            return AppointmentMutationResult.ServiceOfferingNotFound();
        }

        var appointment = new Appointment
        {
            CustomerName = NormalizeRequired(request.CustomerName),
            PhoneNumber = NormalizeOptional(request.PhoneNumber),
            ServiceOfferingId = serviceOffering.Id,
            ServiceName = serviceOffering.Name,
            ServicePrice = serviceOffering.Price,
            ScheduledAt = request.ScheduledAt,
            Status = request.Status,
            Notes = NormalizeOptional(request.Notes),
            CreatedAt = _dateTimeProvider.UtcNow,
            CreatedByUserId = _currentUserService.UserId
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return AppointmentMutationResult.Success(MapToDto(appointment));
    }

    public async Task<AppointmentMutationResult> UpdateAsync(
        int id,
        UpdateAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (appointment is null)
        {
            return AppointmentMutationResult.AppointmentNotFound();
        }

        var serviceOffering = await GetServiceOfferingAsync(
            request.ServiceOfferingId,
            cancellationToken);

        if (serviceOffering is null)
        {
            return AppointmentMutationResult.ServiceOfferingNotFound();
        }

        appointment.CustomerName = NormalizeRequired(request.CustomerName);
        appointment.PhoneNumber = NormalizeOptional(request.PhoneNumber);
        appointment.ServiceOfferingId = serviceOffering.Id;
        appointment.ServiceName = serviceOffering.Name;
        appointment.ServicePrice = serviceOffering.Price;
        appointment.ScheduledAt = request.ScheduledAt;
        appointment.Status = request.Status;
        appointment.Notes = NormalizeOptional(request.Notes);
        appointment.LastModifiedAt = _dateTimeProvider.UtcNow;
        appointment.LastModifiedByUserId = _currentUserService.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return AppointmentMutationResult.Success(MapToDto(appointment));
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (appointment is null)
        {
            return false;
        }

        _dbContext.Appointments.Remove(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private Task<ServiceOffering?> GetServiceOfferingAsync(
        int serviceOfferingId,
        CancellationToken cancellationToken) =>
        _dbContext.ServiceOfferings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == serviceOfferingId, cancellationToken);

    private static AppointmentDto MapToDto(Appointment appointment)
    {
        return new AppointmentDto
        {
            Id = appointment.Id,
            CustomerName = appointment.CustomerName,
            PhoneNumber = appointment.PhoneNumber,
            ServiceOfferingId = appointment.ServiceOfferingId,
            ServiceName = appointment.ServiceName,
            ServicePrice = appointment.ServicePrice,
            ScheduledAt = appointment.ScheduledAt,
            Status = appointment.Status,
            Notes = appointment.Notes,
            CreatedAt = appointment.CreatedAt,
            LastModifiedAt = appointment.LastModifiedAt
        };
    }

    private static string NormalizeRequired(string value) => value.Trim();

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
