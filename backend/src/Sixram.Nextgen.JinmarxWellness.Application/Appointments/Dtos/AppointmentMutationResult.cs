namespace Sixram.Nextgen.JinmarxWellness.Application.Appointments.Dtos;

public enum AppointmentMutationStatus
{
    Success,
    AppointmentNotFound,
    ServiceOfferingNotFound
}

public sealed class AppointmentMutationResult
{
    private AppointmentMutationResult(
        AppointmentMutationStatus status,
        AppointmentDto? appointment = null)
    {
        Status = status;
        Appointment = appointment;
    }

    public AppointmentMutationStatus Status { get; }
    public AppointmentDto? Appointment { get; }

    public static AppointmentMutationResult Success(AppointmentDto appointment)
        => new(AppointmentMutationStatus.Success, appointment);

    public static AppointmentMutationResult AppointmentNotFound()
        => new(AppointmentMutationStatus.AppointmentNotFound);

    public static AppointmentMutationResult ServiceOfferingNotFound()
        => new(AppointmentMutationStatus.ServiceOfferingNotFound);
}
