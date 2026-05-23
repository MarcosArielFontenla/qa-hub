using Microsoft.AspNetCore.Mvc;
using QaTestCaseHub.Modules.Executions.Application;
using QaTestCaseHub.Shared.Contracts.Executions;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api")]
public sealed class ExecutionsController(ExecutionApplicationService executionService) : ControllerBase
{
    [HttpPost("test-cases/{testCaseId:guid}/executions")]
    public async Task<ActionResult<TestExecutionDto>> Create(Guid testCaseId, CreateExecutionRequest request, CancellationToken cancellationToken)
    {
        var created = await executionService.CreateAsync(testCaseId, request, cancellationToken);
        return created is null ? NotFound() : Ok(created);
    }

    [HttpGet("test-cases/{testCaseId:guid}/executions")]
    public async Task<ActionResult<IReadOnlyList<TestExecutionDto>>> GetForTestCase(Guid testCaseId, CancellationToken cancellationToken)
    {
        return Ok(await executionService.GetForTestCaseAsync(testCaseId, cancellationToken));
    }

    [HttpGet("executions")]
    public async Task<ActionResult<IReadOnlyList<TestExecutionDto>>> GetRecent([FromQuery] int take, CancellationToken cancellationToken)
    {
        return Ok(await executionService.GetRecentAsync(take <= 0 ? 20 : take, cancellationToken));
    }
}
