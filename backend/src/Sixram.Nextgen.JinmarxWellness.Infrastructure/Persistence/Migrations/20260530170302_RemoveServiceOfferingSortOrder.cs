using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveServiceOfferingSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId_SortOrder",
                table: "ServiceOfferings");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ServiceOfferings");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId",
                table: "ServiceOfferings",
                column: "ServiceCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId",
                table: "ServiceOfferings");

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ServiceOfferings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId_SortOrder",
                table: "ServiceOfferings",
                columns: new[] { "ServiceCategoryId", "SortOrder" });
        }
    }
}
