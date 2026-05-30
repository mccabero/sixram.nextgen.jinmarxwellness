namespace Sixram.Nextgen.JinmarxWellness.Application.ServiceCategories.Dtos;

public enum ServiceCategoryMutationStatus
{
    Success,
    NotFound,
    DuplicateName
}

public class ServiceCategoryMutationResult
{
    public ServiceCategoryMutationStatus Status { get; init; }
    public ServiceCategoryDto? ServiceCategory { get; init; }

    public static ServiceCategoryMutationResult Success(ServiceCategoryDto serviceCategory) =>
        new()
        {
            Status = ServiceCategoryMutationStatus.Success,
            ServiceCategory = serviceCategory
        };

    public static ServiceCategoryMutationResult NotFound() =>
        new() { Status = ServiceCategoryMutationStatus.NotFound };

    public static ServiceCategoryMutationResult DuplicateName() =>
        new() { Status = ServiceCategoryMutationStatus.DuplicateName };
}
