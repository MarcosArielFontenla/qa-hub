using QaTestCaseHub.Shared.Contracts.Common;

namespace QaTestCaseHub.Shared.Contracts.TestCases;

public sealed record TestCaseDto(
    Guid Id,
    string? JiraIssueId,
    string? JiraIssueKey,
    string ProjectKey,
    string? ParentIssueKey,
    string? ParentSummary,
    string? IssueType,
    string Summary,
    string? FeatureName,
    string? ScenarioName,
    string GherkinText,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Labels,
    string? Priority,
    string? JiraStatus,
    string? AssigneeDisplayName,
    AutomationStatus AutomationStatus,
    ExecutionResult? LastExecutionResult,
    DateTimeOffset? LastExecutedAt,
    DateTimeOffset? LastSyncedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record TestCaseListResponse(
    IReadOnlyList<TestCaseDto> Items,
    int Total,
    int Page,
    int PageSize);

public sealed record TestCaseQuery(
    string? ProjectKey,
    string? ParentIssueKey,
    string? Status,
    string? Assignee,
    string? Priority,
    string? Label,
    string? Tag,
    AutomationStatus? AutomationStatus,
    ExecutionResult? ExecutionResult,
    string? Search,
    int Page = 1,
    int PageSize = 50,
    string? SortBy = "updatedAt",
    string? SortDirection = "desc");

public sealed record UpdateAutomationStatusRequest(AutomationStatus AutomationStatus);

public sealed record SyncJiraRequest(string Jql, int MaxResults = 200);

public sealed record SyncJiraResponse(
    int TotalFetched,
    int Created,
    int Updated,
    int Errors,
    IReadOnlyList<TestCaseDto> Items);
