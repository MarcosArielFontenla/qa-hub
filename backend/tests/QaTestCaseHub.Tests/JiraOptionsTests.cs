using QaTestCaseHub.Shared.Infrastructure.Configuration;

namespace QaTestCaseHub.Tests;

public sealed class JiraOptionsTests
{
    [Fact]
    public void HasCredentials_returns_false_for_example_placeholders()
    {
        var options = new JiraOptions
        {
            BaseUrl = "https://your-company.atlassian.net",
            Email = "qa@example.com",
            ApiToken = "your-api-token"
        };

        Assert.False(options.HasCredentials);
    }

    [Fact]
    public void HasCredentials_returns_true_for_non_placeholder_values()
    {
        var options = new JiraOptions
        {
            BaseUrl = "https://company.atlassian.net",
            Email = "qa@company.com",
            ApiToken = "secret-token"
        };

        Assert.True(options.HasCredentials);
    }
}
