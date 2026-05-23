namespace QaTestCaseHub.Modules.TestCases.Domain.Entities;

public sealed class TestCase
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string? JiraIssueId { get; set; }
    public string? JiraIssueKey { get; set; }
    public required string ProjectKey { get; set; }
    public string? ParentIssueKey { get; set; }
    public string? ParentSummary { get; set; }
    public string? IssueType { get; set; }
    public required string Summary { get; set; }
    public string? FeatureName { get; set; }
    public string? ScenarioName { get; set; }
    public required string GherkinText { get; set; }
    public string[] Tags { get; set; } = [];
    public string[] Labels { get; set; } = [];
    public string? Priority { get; set; }
    public string? JiraStatus { get; set; }
    public string? AssigneeDisplayName { get; set; }
    public string AutomationStatus { get; set; } = "ManualOnly";
    public string? LastExecutionResult { get; set; }
    public DateTimeOffset? LastExecutedAt { get; set; }
    public DateTimeOffset? LastSyncedAt { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
