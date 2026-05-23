using Microsoft.AspNetCore.Mvc;
using QaTestCaseHub.Modules.TestCases.Application;
using QaTestCaseHub.Shared.Contracts.Common;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api/test-cases")]
public sealed class TestCasesController(TestCaseApplicationService testCaseService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TestCaseListResponse>> Get([FromQuery] TestCaseQuery query, CancellationToken cancellationToken)
    {
        return Ok(await testCaseService.GetAsync(query, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestCaseDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await testCaseService.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TestCaseDto>> Create(CreateTestCaseRequest request, CancellationToken cancellationToken)
    {
        var created = await testCaseService.CreateLocalAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPatch("{id:guid}/automation-status")]
    public async Task<ActionResult<TestCaseDto>> UpdateAutomationStatus(Guid id, UpdateAutomationStatusRequest request, CancellationToken cancellationToken)
    {
        var updated = await testCaseService.UpdateAutomationStatusAsync(id, request.AutomationStatus, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }
}
