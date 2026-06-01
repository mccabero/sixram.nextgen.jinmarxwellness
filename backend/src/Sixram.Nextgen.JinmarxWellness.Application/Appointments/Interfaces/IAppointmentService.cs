using Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Appointments.Interfaces;

public interface IAppointmentService
{
    Task<IReadOnlyCollection<AppointmentDto>> GetAllAsync(
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default);

    Task<AppointmentDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<AppointmentMutationResult> CreateAsync(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken = default);

    Task<AppointmentMutationResult> UpdateAsync(
        int id,
        UpdateAppointmentRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
