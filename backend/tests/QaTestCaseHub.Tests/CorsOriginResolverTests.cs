using QaTestCaseHub.Shared.Infrastructure.Configuration;

namespace QaTestCaseHub.Tests;

public sealed class CorsOriginResolverTests
{
    [Fact]
    public void ResolveAllowedOrigins_adds_127_alias_for_localhost_origins()
    {
        var origins = CorsOriginResolver.ResolveAllowedOrigins("http://localhost:5173");

        Assert.Contains("http://localhost:5173", origins);
        Assert.Contains("http://127.0.0.1:5173", origins);
    }

    [Fact]
    public void ResolveAllowedOrigins_adds_localhost_alias_for_127_origins()
    {
        var origins = CorsOriginResolver.ResolveAllowedOrigins("http://127.0.0.1:5173");

        Assert.Contains("http://127.0.0.1:5173", origins);
        Assert.Contains("http://localhost:5173", origins);
    }

    [Fact]
    public void ResolveAllowedOrigins_keeps_remote_origins_exact()
    {
        var origins = CorsOriginResolver.ResolveAllowedOrigins("https://app.example.com");

        Assert.Equal(["https://app.example.com"], origins);
    }
}
