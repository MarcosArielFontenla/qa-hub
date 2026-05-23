using QaTestCaseHub.Shared.Contracts.Common;

namespace QaTestCaseHub.Shared.Contracts.Executions;

public sealed record TestExecutionDto(
    Guid Id,
    Guid TestCaseId,
    string? TestCaseSummary,
    string? JiraIssueKey,
    ExecutionResult Result,
    string? ExecutedBy,
    string? Comment,
    string? EvidenceUrl,
    string? EvidenceText,
    string? JiraBugKey,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt,
    DateTimeOffset CreatedAt,
    string? Warning = null);

public sealed record CreateExecutionRequest(
    ExecutionResult Result,
    string? ExecutedBy,
    string? Comment,
    string? EvidenceUrl,
    string? EvidenceText,
    bool CreateBug,
    string? BugSummary,
    string? BugDescription);
