using Microsoft.Extensions.DependencyInjection;
using QaTestCaseHub.Modules.Dashboard.Application;

namespace QaTestCaseHub.Modules.Dashboard.Infrastructure.DependencyInjection;

public static class DashboardModuleServiceCollectionExtensions
{
    public static IServiceCollection AddDashboardModule(this IServiceCollection services)
    {
        services.AddScoped<DashboardApplicationService>();
        return services;
    }
}
