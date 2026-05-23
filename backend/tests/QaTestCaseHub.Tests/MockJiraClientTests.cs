using Microsoft.Extensions.Options;
using QaTestCaseHub.Shared.Contracts.Jira;
using QaTestCaseHub.Shared.Infrastructure.Configuration;
using QaTestCaseHub.Shared.Infrastructure.Jira;

namespace QaTestCaseHub.Tests;

public sealed class MockJiraClientTests
{
    private static MockJiraClient CreateClient()
        => new(Options.Create(new JiraOptions { MockMode = true, ProjectKey = "QA" }));

    [Fact]
    public async Task SearchIssues_returns_at_least_25_cases_with_expected_tags()
    {
        var issues = await CreateClient().SearchIssuesAsync("project = QA", 200, CancellationToken.None);

        Assert.True(issues.Count >= 25);

        var tags = issues.SelectMany(issue => issue.Tags).ToHashSet();
        foreach (var expected in new[] { "@smoke", "@regression", "@login", "@api", "@mobile" })
        {
            Assert.Contains(expected, tags);
        }
    }

    [Fact]
    public async Task CreateBug_returns_mock_key()
    {
        var result = await CreateClient().CreateBugAsync(
            new CreateJiraBugRequest("QA", "Falla demo", "Detalle", "QA-1"),
            CancellationToken.None);

        Assert.True(result.Success);
        Assert.NotNull(result.JiraIssueKey);
        Assert.StartsWith("MOCK-", result.JiraIssueKey);
    }
}
