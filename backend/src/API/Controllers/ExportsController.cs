using Microsoft.AspNetCore.Mvc;
using QaTestCaseHub.Modules.TestCases.Application;
using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.API.Controllers;

[ApiController]
[Route("api/exports")]
public sealed class ExportsController(TestCaseApplicationService testCaseService) : ControllerBase
{
    [HttpGet("test-cases.csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] TestCaseQuery query, CancellationToken cancellationToken)
    {
        var csv = await testCaseService.ExportCsvAsync(query, cancellationToken);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "test-cases.csv");
    }
}
