namespace Sixram.Nextgen.JinmarxWellness.Application.Auth.Dtos;

public class CurrentUserResponse
{
    public int Id { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public IReadOnlyList<string> Roles { get; init; } = [];
    public IReadOnlyCollection<UserPermissionResponse> Permissions { get; init; } = [];
}
