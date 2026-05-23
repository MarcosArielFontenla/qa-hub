using QaTestCaseHub.Shared.Contracts.TestCases;

namespace QaTestCaseHub.Shared.Abstractions.Exports;

public interface ITestCaseExportService
{
    string ToCsv(IEnumerable<TestCaseDto> testCases);
}
