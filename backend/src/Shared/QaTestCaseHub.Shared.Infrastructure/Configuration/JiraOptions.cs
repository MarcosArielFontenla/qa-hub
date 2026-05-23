using QaTestCaseHub.Shared.Contracts.Jira;

namespace QaTestCaseHub.Shared.Infrastructure.Configuration;

public sealed class JiraOptions
{
    public string? BaseUrl { get; set; }
    public string? Email { get; set; }
    public string? ApiToken { get; set; }
    public string? ProjectKey { get; set; }
    public string TestCaseIssueType { get; set; } = "Sub-task";
    public string BugIssueType { get; set; } = "Bug";
    public string GherkinField { get; set; } = "description";
    public string ParentField { get; set; } = "parent";
    public string LabelsField { get; set; } = "labels";
    public bool MockMode { get; set; }

    public bool HasCredentials =>
        IsConfiguredValue(BaseUrl) &&
        IsConfiguredValue(Email) &&
        IsConfiguredValue(ApiToken);

    public JiraSettingsDto ToSettings(bool useMockMode)
    {
        return new JiraSettingsDto(
            BaseUrl,
            ProjectKey,
            TestCaseIssueType,
            BugIssueType,
            GherkinField,
            ParentField,
            LabelsField,
            useMockMode);
    }

    private static bool IsConfiguredValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return !value.Contains("your-", StringComparison.OrdinalIgnoreCase) &&
            !value.Contains("example", StringComparison.OrdinalIgnoreCase);
    }
}
