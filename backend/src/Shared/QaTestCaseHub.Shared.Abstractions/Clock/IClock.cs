namespace QaTestCaseHub.Shared.Abstractions.Clock;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
