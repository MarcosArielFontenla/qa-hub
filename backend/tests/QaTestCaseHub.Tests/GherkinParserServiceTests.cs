using QaTestCaseHub.Shared.Infrastructure.Gherkin;

namespace QaTestCaseHub.Tests;

public sealed class GherkinParserServiceTests
{
    private readonly GherkinParserService parser = new();

    [Fact]
    public void Parse_extracts_feature_scenario_and_tags_in_english()
    {
        const string content = """
            @smoke @login
            Feature: Authentication

            Scenario: Successful login
              Given the user is on the login page
              When the user submits valid credentials
              Then the dashboard is displayed
            """;

        var result = parser.Parse(content);

        Assert.Equal("Authentication", result.FeatureName);
        Assert.Equal("Successful login", result.ScenarioName);
        Assert.Contains("@smoke", result.Tags);
        Assert.Contains("@login", result.Tags);
    }

    [Fact]
    public void Parse_extracts_feature_scenario_and_tags_in_spanish()
    {
        const string content = """
            @regression
            Característica: Autenticación

            Escenario: Login inválido
              Dado el usuario está en la pantalla de login
              Cuando ingresa una contraseña inválida
              Entonces debería ver un mensaje de error
            """;

        var result = parser.Parse(content);

        Assert.Equal("Autenticación", result.FeatureName);
        Assert.Equal("Login inválido", result.ScenarioName);
        Assert.Contains("@regression", result.Tags);
    }

    [Fact]
    public void Parse_returns_empty_document_for_blank_content()
    {
        var result = parser.Parse("   ");

        Assert.Null(result.FeatureName);
        Assert.Null(result.ScenarioName);
        Assert.Empty(result.Tags);
    }

    [Fact]
    public void Parse_degrades_gracefully_extracting_tags_from_invalid_gherkin()
    {
        const string content = "@smoke esto no es un documento gherkin válido";

        var result = parser.Parse(content);

        Assert.Null(result.FeatureName);
        Assert.Contains("@smoke", result.Tags);
    }
}
