using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceOfferings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceOfferings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false, defaultValueSql: "NEXT VALUE FOR [JinmarxWellnessIntIds]"),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AddOnDetails = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    IsHomeService = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    LastModifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceOfferings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false, defaultValueSql: "NEXT VALUE FOR [JinmarxWellnessIntIds]"),
                    Key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Group = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsEncrypted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    LastModifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_Category_SortOrder",
                table: "ServiceOfferings",
                columns: new[] { "Category", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOfferings_IsActive",
                table: "ServiceOfferings",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_Group",
                table: "SystemSettings",
                column: "Group");

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_Key",
                table: "SystemSettings",
                column: "Key",
                unique: true);

            var createdAt = new DateTimeOffset(2026, 5, 30, 16, 0, 50, TimeSpan.Zero);

            migrationBuilder.InsertData(
                table: "ServiceOfferings",
                columns: new[]
                {
                    "Name",
                    "Category",
                    "Description",
                    "DurationMinutes",
                    "Price",
                    "AddOnDetails",
                    "IsHomeService",
                    "IsActive",
                    "SortOrder",
                    "CreatedAt"
                },
                values: new object[,]
                {
                    { "Pure Thai Massage", "Premium Package", "Skilled massage techniques to experience.", null, 600m, "+ 1 Hour 550", false, true, 10, createdAt },
                    { "Swedish Massage", "Premium Package", "Relax and indulge tired and stressed achy muscles.", null, 450m, "+ free hotstone", false, true, 20, createdAt },
                    { "Whole Body Combination", "Premium Package", "A classic massage experience performed with expertise.", null, 550m, "+ free ventosa or hotstone; + 30mins 250", false, true, 30, createdAt },
                    { "Foot Reflexology", "Specialized Therapy", "Relieves stress and promotes overall well-being.", null, 550m, "+ Foot Scrub 300", false, true, 40, createdAt },
                    { "Frozen Shoulder", "Additional Services", null, null, null, null, false, true, 50, createdAt },
                    { "Guasa", "Additional Services", null, null, null, null, false, true, 60, createdAt },
                    { "Slimpack", "Additional Services", null, null, null, null, false, true, 70, createdAt },
                    { "Scocoa", "Additional Services", null, null, null, null, false, true, 80, createdAt },
                    { "Luluran", "Additional Services", null, null, null, null, false, true, 90, createdAt },
                    { "Ayurvedic", "Additional Services", null, null, null, null, false, true, 100, createdAt },
                    { "Tapalodo", "Additional Services", null, null, null, null, false, true, 110, createdAt },
                    { "Socolase", "Additional Services", null, null, null, null, false, true, 120, createdAt },
                    { "Padastri", "Additional Services", null, null, null, null, false, true, 130, createdAt },
                    { "Massage", "Additional Services", null, null, null, null, false, true, 140, createdAt },
                    { "Traditional Massage", "Additional Services", null, null, null, null, false, true, 150, createdAt },
                    { "Relaxation Massage", "Full Body Massage", null, null, 400m, null, false, true, 160, createdAt },
                    { "Athlete Massage", "Full Body Massage", null, null, 450m, null, false, true, 170, createdAt },
                    { "Body Scrub with Wet/dry (Hot Massage)", "Full Body Massage", null, null, 850m, null, false, true, 180, createdAt },
                    { "Jinmarx' Signature Massage with Bone Setting", "Full Body Massage", null, null, 1200m, null, false, true, 190, createdAt },
                    { "Ventosa Therapy", "Full Body Massage", null, null, 550m, null, false, true, 200, createdAt },
                    { "Aromatherapy Massage", "Full Body Massage", null, null, 450m, null, false, true, 210, createdAt },
                    { "Paraffin Wax Massage", "Full Body Massage", null, null, 800m, null, false, true, 220, createdAt },
                    { "Whole Body Massage with Sauna", "Full Body Massage", null, null, 850m, null, false, true, 230, createdAt },
                    { "Whole Body Massage", "Home Services", null, 90, 800m, null, true, true, 240, createdAt },
                    { "Whole Body Massage", "Home Services", null, 120, 1000m, null, true, true, 250, createdAt },
                    { "Whole Body Massage with Ventosa", "Home Services", null, 120, 1150m, null, true, true, 260, createdAt }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceOfferings");

            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
