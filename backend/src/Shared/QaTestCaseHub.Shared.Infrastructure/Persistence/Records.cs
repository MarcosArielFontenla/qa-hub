using QaTestCaseHub.Shared.Contracts.Common;

namespace QaTestCaseHub.Shared.Infrastructure.Persistence;

public sealed class TestCaseRecord
{
    public Guid Id { get; set; }
    public string? JiraIssueId { get; set; }
    public string? JiraIssueKey { get; set; }
    public string ProjectKey { get; set; } = string.Empty;
    public string? ParentIssueKey { get; set; }
    public string? ParentSummary { get; set; }
    public string? IssueType { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string? FeatureName { get; set; }
    public string? ScenarioName { get; set; }
    public string GherkinText { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] Labels { get; set; } = [];
    public string? Priority { get; set; }
    public string? JiraStatus { get; set; }
    public string? AssigneeDisplayName { get; set; }
    public AutomationStatus AutomationStatus { get; set; }
    public ExecutionResult? LastExecutionResult { get; set; }
    public DateTimeOffset? LastExecutedAt { get; set; }
    public DateTimeOffset? LastSyncedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class TestExecutionRecord
{
    public Guid Id { get; set; }
    public Guid TestCaseId { get; set; }
    public ExecutionResult Result { get; set; }
    public string? ExecutedBy { get; set; }
    public string? Comment { get; set; }
    public string? EvidenceUrl { get; set; }
    public string? EvidenceText { get; set; }
    public string? JiraBugKey { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
