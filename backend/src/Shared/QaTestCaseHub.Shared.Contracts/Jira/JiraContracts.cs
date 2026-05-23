namespace QaTestCaseHub.Shared.Contracts.Jira;

public sealed record JiraSettingsDto(
    string? BaseUrl,
    string? ProjectKey,
    string TestCaseIssueType,
    string BugIssueType,
    string GherkinField,
    string ParentField,
    string LabelsField,
    bool MockMode);

public sealed record JiraIssueDto(
    string Id,
    string Key,
    string ProjectKey,
    string? ParentKey,
    string? ParentSummary,
    string IssueType,
    string Summary,
    string GherkinText,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Labels,
    string? Priority,
    string? Status,
    string? AssigneeDisplayName);

public sealed record CreateJiraIssueRequest(
    string ProjectKey,
    string? ParentIssueKey,
    string IssueType,
    string Summary,
    string GherkinText,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Labels,
    string? Priority);

public sealed record CreateJiraIssueResult(
    bool Success,
    string? JiraIssueId,
    string? JiraIssueKey,
    string? ErrorMessage);

public sealed record CreateJiraBugRequest(
    string ProjectKey,
    string Summary,
    string Description,
    string? TestCaseIssueKey);

public sealed record CreateJiraBugResult(
    bool Success,
    string? JiraIssueId,
    string? JiraIssueKey,
    string? LinkWarning,
    string? ErrorMessage);
