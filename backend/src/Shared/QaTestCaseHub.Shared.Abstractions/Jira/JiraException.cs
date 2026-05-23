using System.Net;

namespace QaTestCaseHub.Shared.Abstractions.Jira;

/// <summary>
/// Error de integración con Jira con un código de dominio estable para la API.
/// </summary>
public sealed class JiraException(string code, HttpStatusCode statusCode, string message, string? retryAfter = null)
    : Exception(message)
{
    public string Code { get; } = code;
    public HttpStatusCode StatusCode { get; } = statusCode;
    public string? RetryAfter { get; } = retryAfter;
}
