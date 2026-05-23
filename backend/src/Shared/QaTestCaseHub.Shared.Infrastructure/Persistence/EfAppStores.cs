using Microsoft.EntityFrameworkCore;
using QaTestCaseHub.Shared.Abstractions.Clock;
using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.Executions;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.Shared.Infrastructure.Persistence;

public sealed class EfTestCaseStore(QaHubDbContext dbContext, IClock clock) : ITestCaseStore
{
    public async Task<TestCaseListResponse> GetAsync(TestCaseQuery query, CancellationToken cancellationToken)
    {
        var all = await dbContext.TestCases.AsNoTracking().ToListAsync(cancellationToken);
        var filtered = ApplyFilters(all.Select(ToDto), query).ToList();
        var total = filtered.Count;
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 200);
        var items = filtered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new TestCaseListResponse(items, total, page, pageSize);
    }

    public async Task<IReadOnlyList<TestCaseDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var records = await dbContext.TestCases.AsNoTracking().ToListAsync(cancellationToken);
        return records.Select(ToDto).OrderByDescending(item => item.UpdatedAt).ToList();
    }

    public async Task<TestCaseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var record = await dbContext.TestCases.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        return record is null ? null : ToDto(record);
    }

    public async Task<TestCaseDto?> GetByJiraKeyAsync(string jiraIssueKey, CancellationToken cancellationToken)
    {
        var record = await dbContext.TestCases.AsNoTracking().FirstOrDefaultAsync(item => item.JiraIssueKey == jiraIssueKey, cancellationToken);
        return record is null ? null : ToDto(record);
    }

    public async Task<TestCaseDto?> UpdateAutomationStatusAsync(Guid id, AutomationStatus automationStatus, CancellationToken cancellationToken)
    {
        var record = await dbContext.TestCases.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (record is null)
        {
            return null;
        }

        record.AutomationStatus = automationStatus;
        record.UpdatedAt = clock.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(record);
    }

    public async Task<TestCaseDto> UpsertFromJiraAsync(TestCaseDto testCase, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        TestCaseRecord? record = null;
        if (!string.IsNullOrWhiteSpace(testCase.JiraIssueKey))
        {
            record = await dbContext.TestCases.FirstOrDefaultAsync(item => item.JiraIssueKey == testCase.JiraIssueKey, cancellationToken);
        }

        if (record is null)
        {
            record = new TestCaseRecord { Id = testCase.Id == Guid.Empty ? Guid.NewGuid() : testCase.Id, CreatedAt = now };
            dbContext.TestCases.Add(record);
        }

        record.JiraIssueId = testCase.JiraIssueId;
        record.JiraIssueKey = testCase.JiraIssueKey;
        record.ProjectKey = testCase.ProjectKey;
        record.ParentIssueKey = testCase.ParentIssueKey;
        record.ParentSummary = testCase.ParentSummary;
        record.IssueType = testCase.IssueType;
        record.Summary = testCase.Summary;
        record.FeatureName = testCase.FeatureName;
        record.ScenarioName = testCase.ScenarioName;
        record.GherkinText = testCase.GherkinText;
        record.Tags = testCase.Tags.ToArray();
        record.Labels = testCase.Labels.ToArray();
        record.Priority = testCase.Priority;
        record.JiraStatus = testCase.JiraStatus;
        record.AssigneeDisplayName = testCase.AssigneeDisplayName;
        record.AutomationStatus = testCase.AutomationStatus;
        record.LastExecutionResult = testCase.LastExecutionResult;
        record.LastExecutedAt = testCase.LastExecutedAt;
        record.LastSyncedAt = now;
        record.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(record);
    }

    public async Task UpdateLastExecutionAsync(Guid id, ExecutionResult result, DateTimeOffset executedAt, CancellationToken cancellationToken)
    {
        var record = await dbContext.TestCases.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (record is null)
        {
            return;
        }

        record.LastExecutionResult = result;
        record.LastExecutedAt = executedAt;
        record.UpdatedAt = clock.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task EnsureMockDataAsync(CancellationToken cancellationToken)
    {
        if (await dbContext.TestCases.AnyAsync(cancellationToken))
        {
            return;
        }

        dbContext.TestCases.AddRange(MockTestCaseFactory.Create(clock.UtcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<TestCaseDto> ApplyFilters(IEnumerable<TestCaseDto> items, TestCaseQuery query)
    {
        var filtered = items;
        filtered = Filter(filtered, query.ProjectKey, item => item.ProjectKey);
        filtered = Filter(filtered, query.ParentIssueKey, item => item.ParentIssueKey);
        filtered = Filter(filtered, query.Status, item => item.JiraStatus);
        filtered = Filter(filtered, query.Assignee, item => item.AssigneeDisplayName);
        filtered = Filter(filtered, query.Priority, item => item.Priority);

        if (!string.IsNullOrWhiteSpace(query.Label))
        {
            filtered = filtered.Where(item => item.Labels.Any(label => Contains(label, query.Label)));
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            filtered = filtered.Where(item => item.Tags.Any(tag => Contains(tag, query.Tag)));
        }

        if (query.AutomationStatus is not null)
        {
            filtered = filtered.Where(item => item.AutomationStatus == query.AutomationStatus);
        }

        if (query.ExecutionResult is not null)
        {
            filtered = filtered.Where(item => item.LastExecutionResult == query.ExecutionResult);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            filtered = filtered.Where(item =>
                Contains(item.Summary, query.Search) ||
                Contains(item.ScenarioName, query.Search) ||
                Contains(item.GherkinText, query.Search) ||
                Contains(item.JiraIssueKey, query.Search));
        }

        return (query.SortBy?.ToLowerInvariant(), query.SortDirection?.ToLowerInvariant()) switch
        {
            ("summary", "asc") => filtered.OrderBy(item => item.Summary),
            ("summary", _) => filtered.OrderByDescending(item => item.Summary),
            ("createdat", "asc") => filtered.OrderBy(item => item.CreatedAt),
            ("createdat", _) => filtered.OrderByDescending(item => item.CreatedAt),
            ("updatedat", "asc") => filtered.OrderBy(item => item.UpdatedAt),
            _ => filtered.OrderByDescending(item => item.UpdatedAt)
        };
    }

    private static IEnumerable<TestCaseDto> Filter(IEnumerable<TestCaseDto> items, string? value, Func<TestCaseDto, string?> selector)
    {
        return string.IsNullOrWhiteSpace(value)
            ? items
            : items.Where(item => Contains(selector(item), value));
    }

    private static bool Contains(string? source, string value)
    {
        return source?.Contains(value, StringComparison.OrdinalIgnoreCase) == true;
    }

    public static TestCaseDto ToDto(TestCaseRecord record)
    {
        return new TestCaseDto(
            record.Id,
            record.JiraIssueId,
            record.JiraIssueKey,
            record.ProjectKey,
            record.ParentIssueKey,
            record.ParentSummary,
            record.IssueType,
            record.Summary,
            record.FeatureName,
            record.ScenarioName,
            record.GherkinText,
            record.Tags,
            record.Labels,
            record.Priority,
            record.JiraStatus,
            record.AssigneeDisplayName,
            record.AutomationStatus,
            record.LastExecutionResult,
            record.LastExecutedAt,
            record.LastSyncedAt,
            record.CreatedAt,
            record.UpdatedAt);
    }
}

public sealed class EfExecutionStore(QaHubDbContext dbContext, IClock clock) : IExecutionStore
{
    public async Task<TestExecutionDto> CreateAsync(TestExecutionDto execution, CancellationToken cancellationToken)
    {
        var record = new TestExecutionRecord
        {
            Id = execution.Id == Guid.Empty ? Guid.NewGuid() : execution.Id,
            TestCaseId = execution.TestCaseId,
            Result = execution.Result,
            ExecutedBy = execution.ExecutedBy,
            Comment = execution.Comment,
            EvidenceUrl = execution.EvidenceUrl,
            EvidenceText = execution.EvidenceText,
            JiraBugKey = execution.JiraBugKey,
            StartedAt = execution.StartedAt,
            FinishedAt = execution.FinishedAt,
            CreatedAt = execution.CreatedAt == default ? clock.UtcNow : execution.CreatedAt
        };

        dbContext.TestExecutions.Add(record);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await ToDtoAsync(record, cancellationToken);
    }

    public async Task<IReadOnlyList<TestExecutionDto>> GetForTestCaseAsync(Guid testCaseId, CancellationToken cancellationToken)
    {
        var records = await dbContext.TestExecutions.AsNoTracking()
            .Where(item => item.TestCaseId == testCaseId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        var results = new List<TestExecutionDto>();
        foreach (var record in records)
        {
            results.Add(await ToDtoAsync(record, cancellationToken));
        }

        return results;
    }

    private async Task<TestExecutionDto> ToDtoAsync(TestExecutionRecord record, CancellationToken cancellationToken)
    {
        var testCase = await dbContext.TestCases.AsNoTracking().FirstOrDefaultAsync(item => item.Id == record.TestCaseId, cancellationToken);
        return new TestExecutionDto(
            record.Id,
            record.TestCaseId,
            testCase?.Summary,
            testCase?.JiraIssueKey,
            record.Result,
            record.ExecutedBy,
            record.Comment,
            record.EvidenceUrl,
            record.EvidenceText,
            record.JiraBugKey,
            record.StartedAt,
            record.FinishedAt,
            record.CreatedAt);
    }
}
