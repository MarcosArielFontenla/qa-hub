namespace QaTestCaseHub.Shared.Contracts.Dashboard;

public sealed record DashboardSummaryDto(
    int TotalTestCases,
    int NotRun,
    int Passed,
    int Failed,
    int Blocked,
    int Automated,
    int ManualOnly,
    int ReadyToAutomate,
    double PassRate,
    double AutomationCoverage);
