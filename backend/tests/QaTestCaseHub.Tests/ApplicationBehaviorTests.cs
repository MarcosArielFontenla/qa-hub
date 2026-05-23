using Microsoft.EntityFrameworkCore;
using QaTestCaseHub.Modules.Executions.Application;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.Executions;
using QaTestCaseHub.Shared.Contracts.Jira;
using QaTestCaseHub.Shared.Contracts.TestCases;
using QaTestCaseHub.Shared.Infrastructure.Clock;
using QaTestCaseHub.Shared.Infrastructure.Persistence;

namespace QaTestCaseHub.Tests;

public sealed class ApplicationBehaviorTests
{
    private static QaHubDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<QaHubDbContext>()
            .UseInMemoryDatabase($"qa-tests-{Guid.NewGuid()}")
            .Options;
        return new QaHubDbContext(options);
    }

    private static TestCaseQuery Query(string? projectKey = null, string? tag = null)
        => new(projectKey, null, null, null, null, null, tag, null, null, null, 1, 200, "updatedAt", "desc");

    private sealed class SpyJiraClient : IJiraClient
    {
        public int CreateBugCalls { get; private set; }

        public bool IsMockMode => true;

        public JiraSettingsDto GetSettings() => new(null, "QA", "Sub-task", "Bug", "description", "parent", "labels", true);

        public Task<IReadOnlyList<JiraIssueDto>> SearchIssuesAsync(string jql, int maxResults, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<JiraIssueDto>>([]);

        public Task<CreateJiraBugResult> CreateBugAsync(CreateJiraBugRequest request, CancellationToken cancellationToken)
        {
            CreateBugCalls++;
            return Task.FromResult(new CreateJiraBugResult(true, "1", "MOCK-1", null, null));
        }
    }

    private static async Task<(ExecutionApplicationService Service, SpyJiraClient Jira, Guid TestCaseId)> CreateExecutionServiceAsync()
    {
        var db = CreateDb();
        var clock = new SystemClock();
        var testCaseStore = new EfTestCaseStore(db, clock);
        await testCaseStore.EnsureMockDataAsync(CancellationToken.None);
        var first = (await testCaseStore.GetAsync(Query(), CancellationToken.None)).Items[0];

        var jira = new SpyJiraClient();
        var service = new ExecutionApplicationService(new EfExecutionStore(db, clock), testCaseStore, jira, clock);
        return (service, jira, first.Id);
    }

    [Fact]
    public async Task CreateExecution_with_fail_and_create_bug_calls_jira()
    {
        var (service, jira, testCaseId) = await CreateExecutionServiceAsync();

        var execution = await service.CreateAsync(
            testCaseId,
            new CreateExecutionRequest(ExecutionResult.Fail, "QA Tester", "Falla", null, null, CreateBug: true, "Bug summary", "Bug description"),
            CancellationToken.None);

        Assert.Equal(1, jira.CreateBugCalls);
        Assert.Equal("MOCK-1", execution!.JiraBugKey);
    }

    [Fact]
    public async Task CreateExecution_with_pass_does_not_call_jira_even_if_create_bug_true()
    {
        var (service, jira, testCaseId) = await CreateExecutionServiceAsync();

        var execution = await service.CreateAsync(
            testCaseId,
            new CreateExecutionRequest(ExecutionResult.Pass, "QA Tester", "OK", null, null, CreateBug: true, "Bug summary", null),
            CancellationToken.None);

        Assert.Equal(0, jira.CreateBugCalls);
        Assert.Null(execution!.JiraBugKey);
    }

    [Fact]
    public async Task CreateExecution_with_fail_and_create_bug_requires_bug_summary()
    {
        var (service, _, testCaseId) = await CreateExecutionServiceAsync();

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(
            testCaseId,
            new CreateExecutionRequest(ExecutionResult.Fail, "QA Tester", "Falla", null, null, CreateBug: true, null, null),
            CancellationToken.None));
    }

    [Fact]
    public async Task GetTestCases_respects_tag_and_project_filters()
    {
        var db = CreateDb();
        var store = new EfTestCaseStore(db, new SystemClock());
        await store.EnsureMockDataAsync(CancellationToken.None);

        var smoke = await store.GetAsync(Query(tag: "@smoke"), CancellationToken.None);
        Assert.True(smoke.Total > 0);
        Assert.All(smoke.Items, item => Assert.Contains("@smoke", item.Tags));

        var unknownProject = await store.GetAsync(Query(projectKey: "ZZ"), CancellationToken.None);
        Assert.Equal(0, unknownProject.Total);
    }
}
