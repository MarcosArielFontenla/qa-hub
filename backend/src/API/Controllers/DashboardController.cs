using Microsoft.AspNetCore.Mvc;
using QaTestCaseHub.Modules.Dashboard.Application;
using QaTestCaseHub.Shared.Contracts.Dashboard;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(DashboardApplicationService dashboardService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        return Ok(await dashboardService.GetSummaryAsync(cancellationToken));
    }
}
