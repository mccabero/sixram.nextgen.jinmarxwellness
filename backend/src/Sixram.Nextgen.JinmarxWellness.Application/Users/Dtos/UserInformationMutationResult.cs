namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

public enum UserInformationMutationStatus
{
    Success,
    UserNotFound,
    DuplicateUserName,
    DuplicateEmail,
    RoleNotFound,
    IdentityError
}

public class UserInformationMutationResult
{
    public UserInformationMutationStatus Status { get; init; }
    public UserInformationDto? User { get; init; }
    public IReadOnlyCollection<string> Errors { get; init; } = [];

    public static UserInformationMutationResult Success(UserInformationDto user) =>
        new()
        {
            Status = UserInformationMutationStatus.Success,
            User = user
        };

    public static UserInformationMutationResult UserNotFound() =>
        new() { Status = UserInformationMutationStatus.UserNotFound };

    public static UserInformationMutationResult DuplicateUserName() =>
        new() { Status = UserInformationMutationStatus.DuplicateUserName };

    public static UserInformationMutationResult DuplicateEmail() =>
        new() { Status = UserInformationMutationStatus.DuplicateEmail };

    public static UserInformationMutationResult RoleNotFound() =>
        new() { Status = UserInformationMutationStatus.RoleNotFound };

    public static UserInformationMutationResult IdentityError(IEnumerable<string> errors) =>
        new()
        {
            Status = UserInformationMutationStatus.IdentityError,
            Errors = errors.ToArray()
        };
}
