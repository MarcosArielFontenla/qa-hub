using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QaTestCaseHub.Shared.Abstractions.Clock;
using QaTestCaseHub.Shared.Abstractions.Exports;
using QaTestCaseHub.Shared.Abstractions.Gherkin;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Infrastructure.Clock;
using QaTestCaseHub.Shared.Infrastructure.Configuration;
using QaTestCaseHub.Shared.Infrastructure.Exports;
using QaTestCaseHub.Shared.Infrastructure.Gherkin;
using QaTestCaseHub.Shared.Infrastructure.Jira;
using QaTestCaseHub.Shared.Infrastructure.Persistence;

namespace QaTestCaseHub.Shared.Infrastructure.DependencyInjection;

public static class SharedInfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddSharedInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JiraOptions>(options =>
        {
            options.BaseUrl = Read(configuration, "JIRA_BASE_URL", "Jira:BaseUrl");
            options.Email = Read(configuration, "JIRA_EMAIL", "Jira:Email");
            options.ApiToken = Read(configuration, "JIRA_API_TOKEN", "Jira:ApiToken");
            options.ProjectKey = Read(configuration, "JIRA_PROJECT_KEY", "Jira:ProjectKey") ?? "QA";
            options.TestCaseIssueType = Read(configuration, "JIRA_TEST_CASE_ISSUE_TYPE", "Jira:TestCaseIssueType") ?? "Sub-task";
            options.BugIssueType = Read(configuration, "JIRA_BUG_ISSUE_TYPE", "Jira:BugIssueType") ?? "Bug";
            options.GherkinField = Read(configuration, "JIRA_GHERKIN_FIELD", "Jira:GherkinField") ?? "description";
            options.ParentField = Read(configuration, "JIRA_PARENT_FIELD", "Jira:ParentField") ?? "parent";
            options.LabelsField = Read(configuration, "JIRA_LABELS_FIELD", "Jira:LabelsField") ?? "labels";
            options.MockMode = bool.TryParse(Read(configuration, "JIRA_MOCK_MODE", "Jira:MockMode"), out var mockMode) && mockMode;
        });

        services.AddDbContext<QaHubDbContext>(options =>
        {
            options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            var localConnectionString = configuration.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrWhiteSpace(databaseUrl))
            {
                options.UseNpgsql(DatabaseUrlParser.ToNpgsqlConnectionString(databaseUrl));
            }
            else if (!string.IsNullOrWhiteSpace(localConnectionString))
            {
                options.UseNpgsql(localConnectionString);
            }
            else
            {
                options.UseInMemoryDatabase("qa-test-case-hub");
            }
        });

        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<IGherkinParserService, GherkinParserService>();
        services.AddScoped<ITestCaseExportService, TestCaseExportService>();
        services.AddScoped<ITestCaseStore, EfTestCaseStore>();
        services.AddScoped<IExecutionStore, EfExecutionStore>();
        services.AddHttpClient<JiraClient>();
        services.AddScoped<IJiraClient>(provider =>
        {
            var options = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<JiraOptions>>().Value;
            return options.MockMode || !options.HasCredentials
                ? provider.GetRequiredService<MockJiraClient>()
                : provider.GetRequiredService<JiraClient>();
        });
        services.AddScoped<MockJiraClient>();

        return services;
    }

    private static string? Read(IConfiguration configuration, string envName, string configurationKey)
        => Environment.GetEnvironmentVariable(envName) ?? configuration[configurationKey];
}
