using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.Executions;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.Shared.Abstractions.Persistence;

public interface ITestCaseStore
{
    Task<TestCaseListResponse> GetAsync(TestCaseQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<TestCaseDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<TestCaseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<TestCaseDto?> GetByJiraKeyAsync(string jiraIssueKey, CancellationToken cancellationToken);
    Task<TestCaseDto?> UpdateAutomationStatusAsync(Guid id, AutomationStatus automationStatus, CancellationToken cancellationToken);
    Task<TestCaseDto> UpsertFromJiraAsync(TestCaseDto testCase, CancellationToken cancellationToken);
    Task UpdateLastExecutionAsync(Guid id, ExecutionResult result, DateTimeOffset executedAt, CancellationToken cancellationToken);
    Task EnsureMockDataAsync(CancellationToken cancellationToken);
}

public interface IExecutionStore
{
    Task<TestExecutionDto> CreateAsync(TestExecutionDto execution, CancellationToken cancellationToken);
    Task<IReadOnlyList<TestExecutionDto>> GetForTestCaseAsync(Guid testCaseId, CancellationToken cancellationToken);
    Task<IReadOnlyList<TestExecutionDto>> GetRecentAsync(int take, CancellationToken cancellationToken);
}
