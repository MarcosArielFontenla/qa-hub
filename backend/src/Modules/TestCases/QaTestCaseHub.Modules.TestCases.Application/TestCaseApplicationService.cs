using QaTestCaseHub.Shared.Abstractions.Exports;
using QaTestCaseHub.Shared.Abstractions.Gherkin;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.Modules.TestCases.Application;

public sealed class TestCaseApplicationService(
    ITestCaseStore testCaseStore,
    IJiraClient jiraClient,
    IGherkinParserService gherkinParser,
    ITestCaseExportService exportService)
{
    public Task<TestCaseListResponse> GetAsync(TestCaseQuery query, CancellationToken cancellationToken)
        => testCaseStore.GetAsync(query, cancellationToken);

    public Task<TestCaseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        => testCaseStore.GetByIdAsync(id, cancellationToken);

    public Task<TestCaseDto?> UpdateAutomationStatusAsync(Guid id, AutomationStatus automationStatus, CancellationToken cancellationToken)
        => testCaseStore.UpdateAutomationStatusAsync(id, automationStatus, cancellationToken);

    public async Task<SyncJiraResponse> SyncFromJiraAsync(SyncJiraRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Jql))
        {
            throw new ArgumentException("El JQL es obligatorio.");
        }

        if (request.Jql.Length > 2000)
        {
            throw new ArgumentException("El JQL no puede superar los 2000 caracteres.");
        }

        var issues = await jiraClient.SearchIssuesAsync(request.Jql, request.MaxResults, cancellationToken);
        var upserted = new List<TestCaseDto>();
        var created = 0;
        var updated = 0;
        var errors = 0;

        foreach (var issue in issues)
        {
            try
            {
                var existing = await testCaseStore.GetByJiraKeyAsync(issue.Key, cancellationToken);
                var parsed = gherkinParser.Parse(issue.GherkinText);
                var dto = new TestCaseDto(
                    existing?.Id ?? Guid.NewGuid(),
                    issue.Id,
                    issue.Key,
                    issue.ProjectKey,
                    issue.ParentKey,
                    issue.ParentSummary,
                    issue.IssueType,
                    issue.Summary,
                    parsed.FeatureName,
                    parsed.ScenarioName,
                    issue.GherkinText,
                    parsed.Tags.Count > 0 ? parsed.Tags : issue.Tags,
                    issue.Labels,
                    issue.Priority,
                    issue.Status,
                    issue.AssigneeDisplayName,
                    existing?.AutomationStatus ?? AutomationStatus.ManualOnly,
                    existing?.LastExecutionResult,
                    existing?.LastExecutedAt,
                    DateTimeOffset.UtcNow,
                    existing?.CreatedAt ?? DateTimeOffset.UtcNow,
                    DateTimeOffset.UtcNow);

                upserted.Add(await testCaseStore.UpsertFromJiraAsync(dto, cancellationToken));
                if (existing is null)
                {
                    created++;
                }
                else
                {
                    updated++;
                }
            }
            catch (Exception)
            {
                errors++;
            }
        }

        return new SyncJiraResponse(issues.Count, created, updated, errors, upserted);
    }

    public async Task<string> ExportCsvAsync(TestCaseQuery query, CancellationToken cancellationToken)
    {
        var response = await testCaseStore.GetAsync(query with { Page = 1, PageSize = 10000 }, cancellationToken);
        return exportService.ToCsv(response.Items);
    }
}
