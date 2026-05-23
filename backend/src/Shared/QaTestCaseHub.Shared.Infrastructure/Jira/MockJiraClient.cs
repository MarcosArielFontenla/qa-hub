using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Jira;
using QaTestCaseHub.Shared.Infrastructure.Configuration;
using QaTestCaseHub.Shared.Infrastructure.Persistence;

namespace QaTestCaseHub.Shared.Infrastructure.Jira;

public sealed class MockJiraClient(IOptions<JiraOptions> options) : IJiraClient
{
    private static int bugCounter;
    private static readonly ConcurrentDictionary<string, CreateJiraBugRequest> CreatedBugs = new();

    private readonly JiraOptions options = options.Value;

    public bool IsMockMode => true;

    public JiraSettingsDto GetSettings() => options.ToSettings(true);

    public Task<IReadOnlyList<JiraIssueDto>> SearchIssuesAsync(string jql, int maxResults, CancellationToken cancellationToken)
    {
        var issues = MockTestCaseFactory.Create(DateTimeOffset.UtcNow)
            .Take(Math.Clamp(maxResults, 1, 200))
            .Select(item => new JiraIssueDto(
                item.JiraIssueId ?? item.Id.ToString("N"),
                item.JiraIssueKey ?? $"QA-{Random.Shared.Next(1000, 9999)}",
                item.ProjectKey,
                item.ParentIssueKey,
                item.ParentSummary,
                item.IssueType ?? options.TestCaseIssueType,
                item.Summary,
                item.GherkinText,
                item.Tags,
                item.Labels,
                item.Priority,
                item.JiraStatus,
                item.AssigneeDisplayName))
            .ToList();

        return Task.FromResult<IReadOnlyList<JiraIssueDto>>(issues);
    }

    public Task<CreateJiraBugResult> CreateBugAsync(CreateJiraBugRequest request, CancellationToken cancellationToken)
    {
        var number = Interlocked.Increment(ref bugCounter);
        var key = $"MOCK-{number}";
        CreatedBugs[key] = request;
        return Task.FromResult(new CreateJiraBugResult(true, number.ToString(), key, null, null));
    }
}
