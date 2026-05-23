using Microsoft.AspNetCore.Mvc;
using QaTestCaseHub.Modules.TestCases.Application;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Contracts.Jira;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api/jira")]
public sealed class JiraController(TestCaseApplicationService testCaseService, IJiraClient jiraClient) : ControllerBase
{
    [HttpPost("sync")]
    public async Task<ActionResult<SyncJiraResponse>> Sync(SyncJiraRequest request, CancellationToken cancellationToken)
    {
        return Ok(await testCaseService.SyncFromJiraAsync(request, cancellationToken));
    }

    [HttpGet("settings")]
    public ActionResult<JiraSettingsDto> GetSettings()
    {
        return Ok(jiraClient.GetSettings());
    }
}
