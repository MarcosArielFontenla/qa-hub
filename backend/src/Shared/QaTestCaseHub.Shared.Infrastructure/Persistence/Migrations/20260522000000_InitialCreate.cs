using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QaTestCaseHub.Shared.Infrastructure.Persistence.Migrations;

[DbContext(typeof(QaHubDbContext))]
[Migration("20260522000000_InitialCreate")]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "test_cases",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                jira_issue_id = table.Column<string>(type: "text", nullable: true),
                jira_issue_key = table.Column<string>(type: "text", nullable: true),
                project_key = table.Column<string>(type: "text", nullable: false),
                parent_issue_key = table.Column<string>(type: "text", nullable: true),
                parent_summary = table.Column<string>(type: "text", nullable: true),
                issue_type = table.Column<string>(type: "text", nullable: true),
                summary = table.Column<string>(type: "text", nullable: false),
                feature_name = table.Column<string>(type: "text", nullable: true),
                scenario_name = table.Column<string>(type: "text", nullable: true),
                gherkin_text = table.Column<string>(type: "text", nullable: false),
                tags = table.Column<string[]>(type: "text[]", nullable: false),
                labels = table.Column<string[]>(type: "text[]", nullable: false),
                priority = table.Column<string>(type: "text", nullable: true),
                jira_status = table.Column<string>(type: "text", nullable: true),
                assignee_display_name = table.Column<string>(type: "text", nullable: true),
                automation_status = table.Column<string>(type: "text", nullable: false),
                last_execution_result = table.Column<string>(type: "text", nullable: true),
                last_executed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                last_synced_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("pk_test_cases", x => x.id));

        migrationBuilder.CreateTable(
            name: "test_executions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                test_case_id = table.Column<Guid>(type: "uuid", nullable: false),
                result = table.Column<string>(type: "text", nullable: false),
                executed_by = table.Column<string>(type: "text", nullable: true),
                comment = table.Column<string>(type: "text", nullable: true),
                evidence_url = table.Column<string>(type: "text", nullable: true),
                evidence_text = table.Column<string>(type: "text", nullable: true),
                jira_bug_key = table.Column<string>(type: "text", nullable: true),
                started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                finished_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("pk_test_executions", x => x.id));

        migrationBuilder.CreateTable(
            name: "import_batches",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                source_type = table.Column<string>(type: "text", nullable: false),
                status = table.Column<string>(type: "text", nullable: false),
                requested_by = table.Column<string>(type: "text", nullable: true),
                total_items = table.Column<int>(type: "integer", nullable: false),
                success_count = table.Column<int>(type: "integer", nullable: false),
                failed_count = table.Column<int>(type: "integer", nullable: false),
                error_summary = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table => table.PrimaryKey("pk_import_batches", x => x.id));

        migrationBuilder.CreateTable(
            name: "jira_sync_logs",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                jql = table.Column<string>(type: "text", nullable: false),
                status = table.Column<string>(type: "text", nullable: false),
                total_fetched = table.Column<int>(type: "integer", nullable: false),
                total_created = table.Column<int>(type: "integer", nullable: false),
                total_updated = table.Column<int>(type: "integer", nullable: false),
                error_message = table.Column<string>(type: "text", nullable: true),
                started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                finished_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table => table.PrimaryKey("pk_jira_sync_logs", x => x.id));

        migrationBuilder.CreateIndex(name: "ix_test_cases_jira_issue_key", table: "test_cases", column: "jira_issue_key", unique: true);
        migrationBuilder.CreateIndex(name: "ix_test_executions_test_case_id", table: "test_executions", column: "test_case_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "import_batches");
        migrationBuilder.DropTable(name: "jira_sync_logs");
        migrationBuilder.DropTable(name: "test_executions");
        migrationBuilder.DropTable(name: "test_cases");
    }
}
