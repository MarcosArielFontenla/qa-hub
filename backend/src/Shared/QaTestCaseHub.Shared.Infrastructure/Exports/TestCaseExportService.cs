using System.Text;
using QaTestCaseHub.Shared.Abstractions.Exports;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.Shared.Infrastructure.Exports;

public sealed class TestCaseExportService : ITestCaseExportService
{
    public string ToCsv(IEnumerable<TestCaseDto> testCases)
    {
        var builder = new StringBuilder();
        builder.AppendLine("jiraIssueKey,summary,featureName,scenarioName,tags,priority,jiraStatus,automationStatus,lastExecutionResult,assigneeDisplayName");
        foreach (var item in testCases)
        {
            builder.AppendLine(string.Join(',', [
                Escape(item.JiraIssueKey),
                Escape(item.Summary),
                Escape(item.FeatureName),
                Escape(item.ScenarioName),
                Escape(string.Join(' ', item.Tags)),
                Escape(item.Priority),
                Escape(item.JiraStatus),
                Escape(item.AutomationStatus.ToString()),
                Escape(item.LastExecutionResult?.ToString()),
                Escape(item.AssigneeDisplayName)
            ]));
        }

        return builder.ToString();
    }

    private static string Escape(string? value)
    {
        value ??= string.Empty;
        if (!value.Contains(',') && !value.Contains('"') && !value.Contains('\n'))
        {
            return value;
        }

        return $"\"{value.Replace("\"", "\"\"")}\"";
    }
}
