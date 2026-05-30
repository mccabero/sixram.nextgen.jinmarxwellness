using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServiceOfferings_Category_SortOrder",
                table: "ServiceOfferings");

            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false, defaultValueSql: "NEXT VALUE FOR [JinmarxWellnessIntIds]"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    LastModifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCategories", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "ServiceCategoryId",
                table: "ServiceOfferings",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                DECLARE @createdAt datetimeoffset = '2026-05-30T16:51:51+00:00';

                DECLARE @categories TABLE
                (
                    Name nvarchar(100) NOT NULL,
                    Description nvarchar(500) NULL
                );

                INSERT INTO @categories (Name, Description)
                VALUES
                    (N'Premium Package', N'Featured massage packages and curated premium offers.'),
                    (N'Specialized Therapy', N'Focused treatments for targeted relief and recovery.'),
                    (N'Additional Services', N'Supplemental therapies and add-on service options.'),
                    (N'Full Body Massage', N'Core full-body massage services.'),
                    (N'Home Services', N'Services available for home appointments.');

                INSERT INTO @categories (Name, Description)
                SELECT DISTINCT LTRIM(RTRIM(Category)), NULL
                FROM ServiceOfferings
                WHERE Category IS NOT NULL
                    AND LTRIM(RTRIM(Category)) <> N'';

                INSERT INTO ServiceCategories (Name, Description, CreatedAt)
                SELECT source.Name, MAX(source.Description), @createdAt
                FROM @categories source
                WHERE NOT EXISTS
                (
                    SELECT 1
                    FROM ServiceCategories existing
                    WHERE existing.Name = source.Name
                )
                GROUP BY source.Name;

                UPDATE serviceOffering
                SET ServiceCategoryId = serviceCategory.Id
                FROM ServiceOfferings serviceOffering
                INNER JOIN ServiceCategories serviceCategory
                    ON serviceCategory.Name = serviceOffering.Category;

                DECLARE @fallbackServiceCategoryId int =
                (
                    SELECT TOP 1 Id
                    FROM ServiceCategories
                    ORDER BY Name
                );

                UPDATE ServiceOfferings
                SET ServiceCategoryId = @fallbackServiceCategoryId
                WHERE ServiceCategoryId IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "ServiceCategoryId",
                table: "ServiceOfferings",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId_SortOrder",
                table: "ServiceOfferings",
                columns: new[] { "ServiceCategoryId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_Name",
                table: "ServiceCategories",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceOfferings_ServiceCategories_ServiceCategoryId",
                table: "ServiceOfferings",
                column: "ServiceCategoryId",
                principalTable: "ServiceCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceOfferings_ServiceCategories_ServiceCategoryId",
                table: "ServiceOfferings");

            migrationBuilder.DropTable(
                name: "ServiceCategories");

            migrationBuilder.DropIndex(
                name: "IX_ServiceOfferings_ServiceCategoryId_SortOrder",
                table: "ServiceOfferings");

            migrationBuilder.DropColumn(
                name: "ServiceCategoryId",
                table: "ServiceOfferings");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_Category_SortOrder",
                table: "ServiceOfferings",
                columns: new[] { "Category", "SortOrder" });
        }
    }
}
