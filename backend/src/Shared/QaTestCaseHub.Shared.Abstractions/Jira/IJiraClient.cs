using QaTestCaseHub.Shared.Contracts.Jira;

namespace QaTestCaseHub.Shared.Abstractions.Jira;

public interface IJiraClient
{
    bool IsMockMode { get; }
    JiraSettingsDto GetSettings();
    Task<IReadOnlyList<JiraIssueDto>> SearchIssuesAsync(string jql, int maxResults, CancellationToken cancellationToken);
    Task<CreateJiraBugResult> CreateBugAsync(CreateJiraBugRequest request, CancellationToken cancellationToken);
}
