using QaTestCaseHub.Shared.Infrastructure.Configuration;

namespace QaTestCaseHub.Tests;

public sealed class DotEnvLoaderTests
{
    [Fact]
    public void Parse_returns_key_value_pairs_without_comments()
    {
        var values = DotEnvLoader.Parse([
            "# comment",
            "DATABASE_URL=postgresql://user:pass@host:5432/db",
            " JIRA_MOCK_MODE = false ",
            "EMPTY=",
            "INVALID"
        ]);

        Assert.Equal("postgresql://user:pass@host:5432/db", values["DATABASE_URL"]);
        Assert.Equal("false", values["JIRA_MOCK_MODE"]);
        Assert.Equal(string.Empty, values["EMPTY"]);
        Assert.False(values.ContainsKey("INVALID"));
    }
}
