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

    [Fact]
    public void Validate_accepts_valid_english_gherkin_and_extracts_metadata()
    {
        const string gherkin = """
            @smoke @login
            Feature: Login
              Scenario: Valid login
                Given a registered user
                When they submit valid credentials
                Then they reach the dashboard
            """;

        var result = parser.Validate(gherkin);

        Assert.True(result.IsValid);
        Assert.Null(result.Error);
        Assert.Equal("Login", result.Document.FeatureName);
        Assert.Equal("Valid login", result.Document.ScenarioName);
        Assert.Contains("@smoke", result.Document.Tags);
    }

    [Fact]
    public void Validate_accepts_spanish_gherkin()
    {
        const string gherkin = """
            Característica: Ingreso
              Escenario: Ingreso válido
                Dado un usuario registrado
                Cuando ingresa credenciales válidas
                Entonces ve el dashboard
            """;

        var result = parser.Validate(gherkin);

        Assert.True(result.IsValid);
        Assert.Equal("Ingreso", result.Document.FeatureName);
    }

    [Fact]
    public void Validate_rejects_empty_and_malformed_gherkin()
    {
        Assert.False(parser.Validate("").IsValid);
        Assert.False(parser.Validate("   ").IsValid);
        // No Feature keyword:
        Assert.False(parser.Validate("just some random text").IsValid);
        // Feature with no scenario:
        Assert.False(parser.Validate("Feature: Empty").IsValid);
    }
}
