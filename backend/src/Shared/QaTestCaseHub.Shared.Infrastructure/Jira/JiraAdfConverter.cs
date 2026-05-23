namespace QaTestCaseHub.Shared.Infrastructure.Jira;

public static class JiraAdfConverter
{
    /// <summary>
    /// Envuelve texto plano como un documento ADF mínimo con un bloque de código,
    /// formato requerido por Jira Cloud para el campo description.
    /// </summary>
    public static object ToAdf(string text)
    {
        return new
        {
            type = "doc",
            version = 1,
            content = new object[]
            {
                new
                {
                    type = "codeBlock",
                    attrs = new { language = "gherkin" },
                    content = new object[]
                    {
                        new { type = "text", text }
                    }
                }
            }
        };
    }
}
