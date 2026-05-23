using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Health;
using QaTestCaseHub.Shared.Infrastructure.Persistence;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(QaHubDbContext dbContext, IJiraClient jiraClient) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<HealthResponse>> Get(CancellationToken cancellationToken)
    {
        var database = "ok";
        try
        {
            _ = await dbContext.TestCases.CountAsync(cancellationToken);
        }
        catch
        {
            database = "error";
        }

        return Ok(new HealthResponse("ok", database, jiraClient.IsMockMode ? "mock" : "real"));
    }
}
