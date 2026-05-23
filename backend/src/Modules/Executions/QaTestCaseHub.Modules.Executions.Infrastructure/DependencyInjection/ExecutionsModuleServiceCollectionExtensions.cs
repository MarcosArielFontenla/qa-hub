using Microsoft.Extensions.DependencyInjection;
using QaTestCaseHub.Modules.Executions.Application;

namespace QaTestCaseHub.Modules.Executions.Infrastructure.DependencyInjection;

public static class ExecutionsModuleServiceCollectionExtensions
{
    public static IServiceCollection AddExecutionsModule(this IServiceCollection services)
    {
        services.AddScoped<ExecutionApplicationService>();
        return services;
    }
}
