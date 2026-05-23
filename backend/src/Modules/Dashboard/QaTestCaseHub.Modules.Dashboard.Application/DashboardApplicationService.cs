using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.Dashboard;

namespace QaTestCaseHub.Modules.Dashboard.Application;

public sealed class DashboardApplicationService(ITestCaseStore testCaseStore)
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var testCases = await testCaseStore.GetAllAsync(cancellationToken);
        var total = testCases.Count;
        var passed = testCases.Count(item => item.LastExecutionResult == ExecutionResult.Pass);
        var failed = testCases.Count(item => item.LastExecutionResult == ExecutionResult.Fail);
        var blocked = testCases.Count(item => item.LastExecutionResult == ExecutionResult.Blocked);
        var notRun = testCases.Count(item => item.LastExecutionResult is null or ExecutionResult.NotRun);
        var automated = testCases.Count(item => item.AutomationStatus == AutomationStatus.Automated);
        var manualOnly = testCases.Count(item => item.AutomationStatus == AutomationStatus.ManualOnly);
        var ready = testCases.Count(item => item.AutomationStatus == AutomationStatus.ReadyToAutomate);
        var executed = passed + failed + blocked;
        var passRate = executed == 0 ? 0 : Math.Round(passed * 100.0 / executed, 1);
        var automationCoverage = total == 0 ? 0 : Math.Round(automated * 100.0 / total, 1);

        return new DashboardSummaryDto(total, notRun, passed, failed, blocked, automated, manualOnly, ready, passRate, automationCoverage);
    }
}
