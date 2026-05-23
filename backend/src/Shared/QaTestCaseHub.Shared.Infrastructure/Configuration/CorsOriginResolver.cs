namespace QaTestCaseHub.Shared.Infrastructure.Configuration;

public static class CorsOriginResolver
{
    private static readonly char[] OriginSeparators = [',', ';'];

    public static string[] ResolveAllowedOrigins(string? configuredOrigins, string fallbackOrigin = "http://localhost:5173")
    {
        var originValue = string.IsNullOrWhiteSpace(configuredOrigins)
            ? fallbackOrigin
            : configuredOrigins;

        var origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawOrigin in originValue.Split(OriginSeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var origin = NormalizeOrigin(rawOrigin);
            if (origin.Length == 0)
            {
                continue;
            }

            origins.Add(origin);
            foreach (var alias in ResolveLoopbackAliases(origin))
            {
                origins.Add(alias);
            }
        }

        return origins.ToArray();
    }

    private static string NormalizeOrigin(string origin)
    {
        if (!Uri.TryCreate(origin.Trim(), UriKind.Absolute, out var uri))
        {
            return origin.Trim().TrimEnd('/');
        }

        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    private static IEnumerable<string> ResolveLoopbackAliases(string origin)
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) || !uri.IsLoopback)
        {
            yield break;
        }

        var aliasHost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            ? "127.0.0.1"
            : uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                ? "localhost"
                : null;

        if (aliasHost is null)
        {
            yield break;
        }

        var alias = new UriBuilder(uri)
        {
            Host = aliasHost
        };

        yield return alias.Uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }
}
