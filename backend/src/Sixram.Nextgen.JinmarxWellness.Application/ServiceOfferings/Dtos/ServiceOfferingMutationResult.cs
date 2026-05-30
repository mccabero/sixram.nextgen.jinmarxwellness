namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceOfferings.Dtos;

public enum ServiceOfferingMutationStatus
{
    Success,
    ServiceOfferingNotFound,
    ServiceCategoryNotFound
}

public class ServiceOfferingMutationResult
{
    public ServiceOfferingMutationStatus Status { get; init; }
    public ServiceOfferingDto? ServiceOffering { get; init; }

    public static ServiceOfferingMutationResult Success(ServiceOfferingDto serviceOffering) =>
        new()
        {
            Status = ServiceOfferingMutationStatus.Success,
            ServiceOffering = serviceOffering
        };

    public static ServiceOfferingMutationResult ServiceOfferingNotFound() =>
        new() { Status = ServiceOfferingMutationStatus.ServiceOfferingNotFound };

    public static ServiceOfferingMutationResult ServiceCategoryNotFound() =>
        new() { Status = ServiceOfferingMutationStatus.ServiceCategoryNotFound };
}
