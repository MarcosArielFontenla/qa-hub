namespace QaTestCaseHub.Shared.Infrastructure.Configuration;

public static class DatabaseUrlParser
{
    public static string ToNpgsqlConnectionString(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty);
        var password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty);
        var database = uri.AbsolutePath.TrimStart('/');
        var isLocalHost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
            uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
            uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase);
        var sslMode = isLocalHost
            ? "SSL Mode=Disable"
            : "SSL Mode=Require;Trust Server Certificate=true";

        return $"Host={uri.Host};Port={uri.Port};Database={database};Username={username};Password={password};{sslMode}";
    }
}
