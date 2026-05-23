using Microsoft.EntityFrameworkCore;

namespace QaTestCaseHub.Shared.Infrastructure.Persistence;

public sealed class QaHubDbContext(DbContextOptions<QaHubDbContext> options) : DbContext(options)
{
    public DbSet<TestCaseRecord> TestCases => Set<TestCaseRecord>();
    public DbSet<TestExecutionRecord> TestExecutions => Set<TestExecutionRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TestCaseRecord>(entity =>
        {
            entity.ToTable("test_cases");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.JiraIssueKey).IsUnique();
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.JiraIssueId).HasColumnName("jira_issue_id");
            entity.Property(item => item.JiraIssueKey).HasColumnName("jira_issue_key");
            entity.Property(item => item.ProjectKey).HasColumnName("project_key");
            entity.Property(item => item.ParentIssueKey).HasColumnName("parent_issue_key");
            entity.Property(item => item.ParentSummary).HasColumnName("parent_summary");
            entity.Property(item => item.IssueType).HasColumnName("issue_type");
            entity.Property(item => item.Summary).HasColumnName("summary");
            entity.Property(item => item.FeatureName).HasColumnName("feature_name");
            entity.Property(item => item.ScenarioName).HasColumnName("scenario_name");
            entity.Property(item => item.GherkinText).HasColumnName("gherkin_text");
            entity.Property(item => item.Tags).HasColumnName("tags");
            entity.Property(item => item.Labels).HasColumnName("labels");
            entity.Property(item => item.Priority).HasColumnName("priority");
            entity.Property(item => item.JiraStatus).HasColumnName("jira_status");
            entity.Property(item => item.AssigneeDisplayName).HasColumnName("assignee_display_name");
            entity.Property(item => item.AutomationStatus).HasColumnName("automation_status").HasConversion<string>();
            entity.Property(item => item.LastExecutionResult).HasColumnName("last_execution_result").HasConversion<string>();
            entity.Property(item => item.LastExecutedAt).HasColumnName("last_executed_at");
            entity.Property(item => item.LastSyncedAt).HasColumnName("last_synced_at");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<TestExecutionRecord>(entity =>
        {
            entity.ToTable("test_executions");
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.TestCaseId);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TestCaseId).HasColumnName("test_case_id");
            entity.Property(item => item.Result).HasColumnName("result").HasConversion<string>();
            entity.Property(item => item.ExecutedBy).HasColumnName("executed_by");
            entity.Property(item => item.Comment).HasColumnName("comment");
            entity.Property(item => item.EvidenceUrl).HasColumnName("evidence_url");
            entity.Property(item => item.EvidenceText).HasColumnName("evidence_text");
            entity.Property(item => item.JiraBugKey).HasColumnName("jira_bug_key");
            entity.Property(item => item.StartedAt).HasColumnName("started_at");
            entity.Property(item => item.FinishedAt).HasColumnName("finished_at");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
        });
    }
}
