using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
