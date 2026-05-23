namespace QaTestCaseHub.Shared.Contracts.Health;

public sealed record HealthResponse(string Status, string Database, string JiraMode);
