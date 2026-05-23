using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QaTestCaseHub.Shared.Infrastructure.Persistence.Migrations;

/// <summary>
/// Quita las tablas fuera de alcance del MVP v2 (import batches y jira sync logs).
/// Es aditiva: se aplica tanto sobre una base nueva como sobre una base de Railway
/// que ya tenga aplicada la migración InitialCreate.
/// </summary>
[DbContext(typeof(QaHubDbContext))]
[Migration("20260523000000_RemoveImportsAndSyncLogs")]
public partial class RemoveImportsAndSyncLogs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "import_batches");
        migrationBuilder.DropTable(name: "jira_sync_logs");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
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
    }
}
