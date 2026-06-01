using Sixram.Nextgen.JinmarxWellness.Application.Users.Dtos;

namespace Sixram.Nextgen.JinmarxWellness.Application.Users.Interfaces;

public interface IUserInformationService
{
    Task<IReadOnlyCollection<UserInformationDto>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<UserInformationDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<UserInformationMutationResult> CreateAsync(
        CreateUserInformationRequest request,
        CancellationToken cancellationToken = default);

    Task<UserInformationMutationResult> UpdateAsync(
        int id,
        UpdateUserInformationRequest request,
        CancellationToken cancellationToken = default);
}
