using System.Text.RegularExpressions;
using Gherkin;
using Gherkin.Ast;
using QaTestCaseHub.Shared.Abstractions.Gherkin;
using QaTestCaseHub.Shared.Contracts.Gherkin;

namespace QaTestCaseHub.Shared.Infrastructure.Gherkin;

/// <summary>
/// Wrapper sobre la librería <c>Gherkin</c> de Cucumber. No implementa un parser propio:
/// delega en la librería y expone solo feature/scenario/tags. Soporta documentos en inglés
/// y en español (vía dialecto o cabecera <c># language: es</c>).
/// </summary>
public sealed partial class GherkinParserService : IGherkinParserService
{
    public ParsedGherkinDocument Parse(string? content) => Validate(content).Document;

    public GherkinValidationResult Validate(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return new GherkinValidationResult(false, "El Gherkin está vacío.", new ParsedGherkinDocument(null, null, []));
        }

        var prepared = EnsureLanguageHeader(content);

        try
        {
            var document = new Parser().Parse(new StringReader(prepared));
            var feature = document.Feature;
            if (feature is null)
            {
                return new GherkinValidationResult(
                    false,
                    "Falta la declaración 'Feature:' (o 'Característica:').",
                    new ParsedGherkinDocument(null, null, ExtractTagsFallback(content)));
            }

            var scenarios = feature.Children.OfType<Scenario>().ToList();
            var firstScenario = scenarios.FirstOrDefault();
            var tags = feature.Tags.Select(tag => tag.Name)
                .Concat(scenarios.SelectMany(scenario => scenario.Tags).Select(tag => tag.Name))
                .Distinct()
                .ToList();

            var parsed = new ParsedGherkinDocument(
                string.IsNullOrWhiteSpace(feature.Name) ? null : feature.Name.Trim(),
                string.IsNullOrWhiteSpace(firstScenario?.Name) ? null : firstScenario!.Name.Trim(),
                tags);

            if (scenarios.Count == 0)
            {
                return new GherkinValidationResult(false, "El feature no tiene ningún Scenario/Escenario.", parsed);
            }

            return new GherkinValidationResult(true, null, parsed);
        }
        catch (Exception ex)
        {
            // Gherkin inválido o incompleto: Parse degrada a extraer solo tags por regex (para que la
            // sincronización desde Jira no falle por un único issue mal formado); Validate informa el error.
            return new GherkinValidationResult(false, ex.Message, new ParsedGherkinDocument(null, null, ExtractTagsFallback(content)));
        }
    }

    private static string EnsureLanguageHeader(string content)
    {
        var lines = content.Replace("\r\n", "\n").Split('\n');
        var hasHeader = lines.Any(line => line.TrimStart().StartsWith("# language:", StringComparison.OrdinalIgnoreCase));
        if (hasHeader || !ContainsSpanishKeywords(lines))
        {
            return content;
        }

        return "# language: es" + Environment.NewLine + content;
    }

    private static bool ContainsSpanishKeywords(IEnumerable<string> lines)
    {
        return lines.Select(line => line.Trim()).Any(line =>
            line.StartsWith("Característica:", StringComparison.OrdinalIgnoreCase) ||
            line.StartsWith("Funcionalidad:", StringComparison.OrdinalIgnoreCase) ||
            line.StartsWith("Esquema del escenario:", StringComparison.OrdinalIgnoreCase) ||
            line.StartsWith("Escenario:", StringComparison.OrdinalIgnoreCase));
    }

    private static IReadOnlyList<string> ExtractTagsFallback(string content)
        => TagRegex().Matches(content).Select(match => match.Value).Distinct().ToList();

    [GeneratedRegex(@"@\w[\w-]*")]
    private static partial Regex TagRegex();
}
