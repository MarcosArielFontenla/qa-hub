using QaTestCaseHub.Shared.Abstractions.Clock;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.Executions;
using QaTestCaseHub.Shared.Contracts.Jira;

namespace QaTestCaseHub.Modules.Executions.Application;

public sealed class ExecutionApplicationService(
    IExecutionStore executionStore,
    ITestCaseStore testCaseStore,
    IJiraClient jiraClient,
    IClock clock)
{
    public async Task<TestExecutionDto?> CreateAsync(Guid testCaseId, CreateExecutionRequest request, CancellationToken cancellationToken)
    {
        var testCase = await testCaseStore.GetByIdAsync(testCaseId, cancellationToken);
        if (testCase is null)
        {
            return null;
        }

        var shouldCreateBug = request.CreateBug && request.Result == ExecutionResult.Fail;
        if (shouldCreateBug && string.IsNullOrWhiteSpace(request.BugSummary))
        {
            throw new ArgumentException("bugSummary es obligatorio cuando se crea un bug.");
        }

        string? bugKey = null;
        string? warning = null;
        if (shouldCreateBug)
        {
            var bug = await jiraClient.CreateBugAsync(new CreateJiraBugRequest(
                testCase.ProjectKey,
                request.BugSummary!,
                request.BugDescription ?? request.Comment ?? "Falla creada desde QA Test Case Hub.",
                testCase.JiraIssueKey), cancellationToken);
            bugKey = bug.JiraIssueKey;
            warning = bug.LinkWarning ?? (bug.Success ? null : bug.ErrorMessage);
        }

        var now = clock.UtcNow;
        var execution = new TestExecutionDto(
            Guid.NewGuid(),
            testCaseId,
            testCase.Summary,
            testCase.JiraIssueKey,
            request.Result,
            request.ExecutedBy,
            request.Comment,
            request.EvidenceUrl,
            request.EvidenceText,
            bugKey,
            now,
            now,
            now);

        var created = await executionStore.CreateAsync(execution, cancellationToken);
        await testCaseStore.UpdateLastExecutionAsync(testCaseId, request.Result, now, cancellationToken);
        return created with { Warning = warning };
    }

    public Task<IReadOnlyList<TestExecutionDto>> GetForTestCaseAsync(Guid testCaseId, CancellationToken cancellationToken)
        => executionStore.GetForTestCaseAsync(testCaseId, cancellationToken);
}
