using QaTestCaseHub.Shared.Abstractions.Clock;

namespace QaTestCaseHub.Shared.Infrastructure.Clock;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
