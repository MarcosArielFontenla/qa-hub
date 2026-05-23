using Microsoft.Extensions.DependencyInjection;
using QaTestCaseHub.Modules.TestCases.Application;

namespace QaTestCaseHub.Modules.TestCases.Infrastructure.DependencyInjection;

public static class TestCasesModuleServiceCollectionExtensions
{
    public static IServiceCollection AddTestCasesModule(this IServiceCollection services)
    {
        services.AddScoped<TestCaseApplicationService>();
        return services;
    }
}
