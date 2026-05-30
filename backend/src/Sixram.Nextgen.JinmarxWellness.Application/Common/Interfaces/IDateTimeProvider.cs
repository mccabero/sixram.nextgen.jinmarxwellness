namespace Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
