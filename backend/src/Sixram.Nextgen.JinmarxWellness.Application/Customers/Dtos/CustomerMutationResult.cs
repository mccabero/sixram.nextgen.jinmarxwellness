namespace Sixram.Nextgen.JinmarxWellness.Application.Customers.Dtos;

public enum CustomerMutationStatus
{
    Success,
    CustomerNotFound
}

public class CustomerMutationResult
{
    public CustomerMutationStatus Status { get; init; }
    public CustomerDto? Customer { get; init; }

    public static CustomerMutationResult Success(CustomerDto customer) =>
        new()
        {
            Status = CustomerMutationStatus.Success,
            Customer = customer
        };

    public static CustomerMutationResult CustomerNotFound() =>
        new() { Status = CustomerMutationStatus.CustomerNotFound };
}
