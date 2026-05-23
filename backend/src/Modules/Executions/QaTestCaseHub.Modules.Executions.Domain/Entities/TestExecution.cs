namespace QaTestCaseHub.Modules.Executions.Domain.Entities;

public sealed class TestExecution
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TestCaseId { get; set; }
    public string Result { get; set; } = "NotRun";
    public string? ExecutedBy { get; set; }
    public string? Comment { get; set; }
    public string? EvidenceUrl { get; set; }
    public string? EvidenceText { get; set; }
    public string? JiraBugKey { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
