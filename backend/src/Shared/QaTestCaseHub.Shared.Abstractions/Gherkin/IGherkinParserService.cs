using QaTestCaseHub.Shared.Contracts.Gherkin;

namespace QaTestCaseHub.Shared.Abstractions.Gherkin;

public interface IGherkinParserService
{
    ParsedGherkinDocument Parse(string? content);
    GherkinValidationResult Validate(string? content);
}
