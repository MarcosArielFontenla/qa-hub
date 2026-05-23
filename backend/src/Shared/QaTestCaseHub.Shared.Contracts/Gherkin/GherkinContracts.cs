namespace QaTestCaseHub.Shared.Contracts.Gherkin;

/// <summary>
/// Resultado mínimo de parsear Gherkin con la librería Cucumber: lo que el MVP
/// necesita persistir desde un issue de Jira (feature, primer scenario y tags).
/// </summary>
public sealed record ParsedGherkinDocument(
    string? FeatureName,
    string? ScenarioName,
    IReadOnlyList<string> Tags);

/// <summary>
/// Resultado de validar Gherkin de forma estricta (para crear casos nuevos).
/// IsValid=false trae el motivo en Error; Document siempre trae lo que se pudo parsear.
/// </summary>
public sealed record GherkinValidationResult(
    bool IsValid,
    string? Error,
    ParsedGherkinDocument Document);
