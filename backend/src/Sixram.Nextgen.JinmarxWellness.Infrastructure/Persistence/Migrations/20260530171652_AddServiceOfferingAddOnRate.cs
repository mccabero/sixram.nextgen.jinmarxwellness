using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceOfferingAddOnRate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AddOnRate",
                table: "ServiceOfferings",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddOnRate",
                table: "ServiceOfferings");
        }
    }
}
