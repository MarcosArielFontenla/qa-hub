namespace QaTestCaseHub.Shared.Contracts.Common;

public enum AutomationStatus
{
    ManualOnly,
    ReadyToAutomate,
    InAutomation,
    Automated,
    Flaky,
    Deprecated
}

public enum ExecutionResult
{
    NotRun,
    Pass,
    Fail,
    Blocked
}
