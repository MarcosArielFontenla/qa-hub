using System.Net;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Common;

namespace QaTestCaseHub.API.Middleware;

public sealed class ApiErrorMiddleware(RequestDelegate next, ILogger<ApiErrorMiddleware> logger, IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (JiraException ex)
        {
            logger.LogWarning(ex, "Jira integration failed with code {Code}.", ex.Code);
            var details = ex.RetryAfter is null ? null : new { retryAfter = ex.RetryAfter };
            await WriteErrorAsync(context, ex.StatusCode, ex.Code, ex.Message, details);
        }
        catch (ArgumentException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, "VALIDATION_ERROR", ex.Message);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "HTTP integration failed.");
            await WriteErrorAsync(context, HttpStatusCode.BadGateway, "JIRA_FIELD_MAPPING_ERROR", "No se pudo completar la operación contra Jira.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled API error.");
            var details = environment.IsDevelopment() ? new { ex.StackTrace } : null;
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "DATABASE_ERROR", "Ocurrió un error interno.", details);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode, string code, string message, object? details = null)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorEnvelope(new ErrorBody(code, message, details)));
    }
}
