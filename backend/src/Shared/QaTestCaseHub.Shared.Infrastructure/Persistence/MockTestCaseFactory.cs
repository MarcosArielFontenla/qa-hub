using QaTestCaseHub.Shared.Contracts.Common;

namespace QaTestCaseHub.Shared.Infrastructure.Persistence;

public static class MockTestCaseFactory
{
    private static readonly string[] Features = ["Autenticación", "Usuarios", "Checkout", "Pagos", "Mobile", "API", "Reportes"];
    private static readonly string[] Priorities = ["Highest", "High", "Medium", "Low"];
    private static readonly string[] Statuses = ["To Do", "In Progress", "Done", "Blocked"];
    private static readonly string[] Assignees = ["María QA", "Julián Automation", "Camila Lead", "Diego QA"];
    private static readonly string[][] Tags =
    [
        ["@smoke", "@login"],
        ["@regression", "@login"],
        ["@api", "@regression"],
        ["@mobile", "@smoke"],
        ["@checkout", "@regression"],
        ["@payments", "@api"]
    ];

    public static IReadOnlyList<TestCaseRecord> Create(DateTimeOffset now)
    {
        return Enumerable.Range(1, 25).Select(index =>
        {
            var feature = Features[index % Features.Length];
            var tags = Tags[index % Tags.Length];
            var summary = $"{feature} - escenario demo {index:00}";
            var result = index % 5 == 0 ? ExecutionResult.Fail :
                index % 4 == 0 ? ExecutionResult.Blocked :
                index % 3 == 0 ? ExecutionResult.Pass :
                ExecutionResult.NotRun;

            return new TestCaseRecord
            {
                Id = Guid.NewGuid(),
                JiraIssueId = $"100{index:000}",
                JiraIssueKey = $"QA-{index}",
                ProjectKey = "QA",
                ParentIssueKey = $"QA-{100 + index % 6}",
                ParentSummary = $"Historia demo {index % 6}",
                IssueType = "Sub-task",
                Summary = summary,
                FeatureName = feature,
                ScenarioName = $"Validar {feature.ToLowerInvariant()} {index:00}",
                GherkinText = BuildGherkin(feature, summary, tags),
                Tags = tags,
                Labels = ["qa", "gherkin", index % 2 == 0 ? "web" : "api"],
                Priority = Priorities[index % Priorities.Length],
                JiraStatus = Statuses[index % Statuses.Length],
                AssigneeDisplayName = Assignees[index % Assignees.Length],
                AutomationStatus = (AutomationStatus)(index % Enum.GetValues<AutomationStatus>().Length),
                LastExecutionResult = result,
                LastExecutedAt = result == ExecutionResult.NotRun ? null : now.AddDays(-index),
                LastSyncedAt = now.AddMinutes(-index),
                CreatedAt = now.AddDays(-30).AddHours(index),
                UpdatedAt = now.AddMinutes(-index)
            };
        }).ToList();
    }

    private static string BuildGherkin(string feature, string summary, IReadOnlyList<string> tags)
    {
        return string.Join(Environment.NewLine, [
            string.Join(' ', tags),
            $"Feature: {feature}",
            string.Empty,
            $"Scenario: {summary}",
            "  Given el usuario tiene datos válidos",
            "  When ejecuta la acción principal",
            "  Then el sistema debería responder correctamente"
        ]);
    }
}
