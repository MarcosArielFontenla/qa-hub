namespace QaTestCaseHub.Shared.Contracts.Gherkin;

/// <summary>
/// Resultado mínimo de parsear Gherkin con la librería Cucumber: lo que el MVP
/// necesita persistir desde un issue de Jira (feature, primer scenario y tags).
/// </summary>
public sealed record ParsedGherkinDocument(
    string? FeatureName,
    string? ScenarioName,
    IReadOnlyList<string> Tags);
