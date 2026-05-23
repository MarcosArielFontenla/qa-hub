using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QaTestCaseHub.API.Middleware;
using QaTestCaseHub.Modules.Dashboard.Infrastructure.DependencyInjection;
using QaTestCaseHub.Modules.Executions.Infrastructure.DependencyInjection;
using QaTestCaseHub.Modules.TestCases.Infrastructure.DependencyInjection;
using QaTestCaseHub.Shared.Abstractions.Jira;
using QaTestCaseHub.Shared.Abstractions.Persistence;
using QaTestCaseHub.Shared.Infrastructure.Configuration;
using QaTestCaseHub.Shared.Infrastructure.DependencyInjection;
using QaTestCaseHub.Shared.Infrastructure.Persistence;

DotEnvLoader.LoadFirstExisting([
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "backend", "src", "API", ".env")
]);

var builder = WebApplication.CreateBuilder(args);

DotEnvLoader.Load(Path.Combine(builder.Environment.ContentRootPath, ".env"));

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var configuredOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN") ??
            builder.Configuration["Frontend:Origin"] ??
            "http://localhost:5173";
        var origins = CorsOriginResolver.ResolveAllowedOrigins(configuredOrigin);

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddSharedInfrastructure(builder.Configuration)
    .AddTestCasesModule()
    .AddExecutionsModule()
    .AddDashboardModule();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ApiErrorMiddleware>();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/healthz");

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<QaHubDbContext>();
    if (dbContext.Database.IsRelational())
    {
        await dbContext.Database.MigrateAsync();
    }

    var jiraOptions = scope.ServiceProvider.GetRequiredService<IOptions<JiraOptions>>().Value;
    if (jiraOptions.MockMode || !dbContext.Database.IsRelational())
    {
        await scope.ServiceProvider.GetRequiredService<ITestCaseStore>().EnsureMockDataAsync(CancellationToken.None);
    }
}

app.Run();
