using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace QaTestCaseHub.Shared.Infrastructure.Persistence.Migrations;

[DbContext(typeof(QaHubDbContext))]
public sealed class QaHubDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "10.0.7");
    }
}
