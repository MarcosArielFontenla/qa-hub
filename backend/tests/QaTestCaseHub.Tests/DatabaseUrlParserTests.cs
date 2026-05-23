using QaTestCaseHub.Shared.Infrastructure.Configuration;

namespace QaTestCaseHub.Tests;

public sealed class DatabaseUrlParserTests
{
    [Fact]
    public void ToNpgsqlConnectionString_disables_ssl_for_localhost()
    {
        var connectionString = DatabaseUrlParser.ToNpgsqlConnectionString("postgresql://postgres:postgres@localhost:5432/qa_test_case_hub");

        Assert.Contains("Host=localhost", connectionString);
        Assert.Contains("SSL Mode=Disable", connectionString);
    }

    [Fact]
    public void ToNpgsqlConnectionString_requires_ssl_for_remote_hosts()
    {
        var connectionString = DatabaseUrlParser.ToNpgsqlConnectionString("postgresql://user:pass@containers-us-west-1.railway.app:6543/railway");

        Assert.Contains("Host=containers-us-west-1.railway.app", connectionString);
        Assert.Contains("SSL Mode=Require", connectionString);
        Assert.Contains("Trust Server Certificate=true", connectionString);
    }
}
