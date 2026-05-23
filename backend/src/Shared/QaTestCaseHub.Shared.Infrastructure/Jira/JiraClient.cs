using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Jira;
using QaTestCaseHub.Shared.Infrastructure.Configuration;

namespace QaTestCaseHub.Shared.Infrastructure.Jira;

public sealed class JiraClient(HttpClient httpClient, IOptions<JiraOptions> options) : IJiraClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly JiraOptions options = options.Value;

    public bool IsMockMode => false;

    public JiraSettingsDto GetSettings() => options.ToSettings(false);

    public async Task<IReadOnlyList<JiraIssueDto>> SearchIssuesAsync(string jql, int maxResults, CancellationToken cancellationToken)
    {
        ConfigureAuth();
        var encodedJql = Uri.EscapeDataString(jql);
        var fields = Uri.EscapeDataString($"summary,status,labels,priority,assignee,parent,issuetype,{options.GherkinField}");
        var url = $"/rest/api/3/search/jql?jql={encodedJql}&maxResults={Math.Clamp(maxResults, 1, 200)}&fields={fields}";
        using var response = await httpClient.GetAsync(url, cancellationToken);
        EnsureJiraSuccess(response);

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var issues = document.RootElement.GetProperty("issues").EnumerateArray();
        return issues.Select(ParseIssue).ToList();
    }

    public async Task<CreateJiraBugResult> CreateBugAsync(CreateJiraBugRequest request, CancellationToken cancellationToken)
    {
        ConfigureAuth();
        var fields = new Dictionary<string, object?>
        {
            ["project"] = new { key = request.ProjectKey },
            ["issuetype"] = new { name = options.BugIssueType },
            ["summary"] = request.Summary,
            ["description"] = JiraAdfConverter.ToAdf(request.Description),
            ["labels"] = new[] { "qa-bug" }
        };

        using var response = await httpClient.PostAsync(
            "/rest/api/3/issue",
            new StringContent(JsonSerializer.Serialize(new { fields }, JsonOptions), Encoding.UTF8, "application/json"),
            cancellationToken);
        EnsureJiraSuccess(response);

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var bugId = document.RootElement.GetProperty("id").GetString();
        var bugKey = document.RootElement.GetProperty("key").GetString();

        var linkWarning = await TryLinkToTestCaseAsync(bugKey, request.TestCaseIssueKey, cancellationToken);
        return new CreateJiraBugResult(true, bugId, bugKey, linkWarning, null);
    }

    private async Task<string?> TryLinkToTestCaseAsync(string? bugKey, string? testCaseKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(bugKey) || string.IsNullOrWhiteSpace(testCaseKey))
        {
            return null;
        }

        var payload = new
        {
            type = new { name = "Relates" },
            inwardIssue = new { key = bugKey },
            outwardIssue = new { key = testCaseKey }
        };

        try
        {
            using var response = await httpClient.PostAsync(
                "/rest/api/3/issueLink",
                new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json"),
                cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return null;
            }

            return response.StatusCode == HttpStatusCode.NotFound
                ? $"El bug {bugKey} se creó pero el tipo de link 'Relates' no está disponible; quedó sin linkear a {testCaseKey}."
                : $"El bug {bugKey} se creó pero no se pudo linkear a {testCaseKey} (HTTP {(int)response.StatusCode}).";
        }
        catch (HttpRequestException)
        {
            return $"El bug {bugKey} se creó pero falló el link a {testCaseKey}.";
        }
    }

    private void ConfigureAuth()
    {
        if (!string.IsNullOrWhiteSpace(options.BaseUrl) && httpClient.BaseAddress is null)
        {
            httpClient.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/'));
        }

        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{options.Email}:{options.ApiToken}"));
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
        httpClient.DefaultRequestHeaders.Accept.Clear();
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    private static void EnsureJiraSuccess(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        switch (response.StatusCode)
        {
            case HttpStatusCode.Unauthorized:
            case HttpStatusCode.Forbidden:
                throw new JiraException("JIRA_AUTH_FAILED", response.StatusCode, "Credenciales de Jira inválidas o sin permisos suficientes.");
            case HttpStatusCode.TooManyRequests:
                throw new JiraException("JIRA_RATE_LIMITED", response.StatusCode, "Jira aplicó rate limiting a la solicitud.", response.Headers.RetryAfter?.ToString());
            case HttpStatusCode.NotFound:
                throw new JiraException("NOT_FOUND", response.StatusCode, "Issue o campo de Jira no encontrado.");
            default:
                response.EnsureSuccessStatusCode();
                break;
        }
    }

    private JiraIssueDto ParseIssue(JsonElement issue)
    {
        var fields = issue.GetProperty("fields");
        var summary = GetString(fields, "summary") ?? issue.GetProperty("key").GetString() ?? "Sin summary";
        var parent = fields.TryGetProperty("parent", out var parentElement) ? parentElement : default;
        var labels = fields.TryGetProperty("labels", out var labelsElement) && labelsElement.ValueKind == JsonValueKind.Array
            ? labelsElement.EnumerateArray().Select(item => item.GetString() ?? string.Empty).Where(item => item.Length > 0).ToList()
            : [];
        var gherkin = ExtractGherkin(fields);
        var tags = labels.Where(item => item.StartsWith('@')).Concat(labels.Where(item => item is "smoke" or "regression" or "login" or "api" or "mobile").Select(item => $"@{item}")).Distinct().ToList();

        return new JiraIssueDto(
            issue.GetProperty("id").GetString() ?? string.Empty,
            issue.GetProperty("key").GetString() ?? string.Empty,
            options.ProjectKey ?? string.Empty,
            parent.ValueKind == JsonValueKind.Object ? GetString(parent, "key") : null,
            parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty("fields", out var parentFields) ? GetString(parentFields, "summary") : null,
            fields.TryGetProperty("issuetype", out var issueType) ? GetString(issueType, "name") ?? options.TestCaseIssueType : options.TestCaseIssueType,
            summary,
            gherkin,
            tags,
            labels,
            fields.TryGetProperty("priority", out var priority) ? GetString(priority, "name") : null,
            fields.TryGetProperty("status", out var status) ? GetString(status, "name") : null,
            fields.TryGetProperty("assignee", out var assignee) ? GetString(assignee, "displayName") : null);
    }

    private string ExtractGherkin(JsonElement fields)
    {
        if (!fields.TryGetProperty(options.GherkinField, out var field))
        {
            return string.Empty;
        }

        if (field.ValueKind == JsonValueKind.String)
        {
            return field.GetString() ?? string.Empty;
        }

        return ExtractText(field);
    }

    private static string ExtractText(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object &&
            element.TryGetProperty("text", out var text) &&
            text.ValueKind == JsonValueKind.String)
        {
            return text.GetString() ?? string.Empty;
        }

        if (element.ValueKind != JsonValueKind.Object && element.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        var children = element.ValueKind == JsonValueKind.Array
            ? element.EnumerateArray()
            : element.EnumerateObject().Where(property => property.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object).Select(property => property.Value);

        return string.Join(Environment.NewLine, children.Select(ExtractText).Where(value => !string.IsNullOrWhiteSpace(value)));
    }

    private static string? GetString(JsonElement element, string property)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }
}
