using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCameraEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CameraEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false, defaultValueSql: "NEXT VALUE FOR [JinmarxWellnessIntIds]"),
                    CameraIp = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Ipv6Address = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    PortNo = table.Column<int>(type: "int", nullable: true),
                    Protocol = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    MacAddress = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    ChannelId = table.Column<int>(type: "int", nullable: true),
                    ChannelName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EventDateTime = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    EventState = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EventDescription = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ActivePostCount = table.Column<int>(type: "int", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    SnapshotPath = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SnapshotUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SnapshotCapturedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    SnapshotError = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RawXml = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    LastModifiedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CameraEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CameraEvents_CameraIp_EventDateTime",
                table: "CameraEvents",
                columns: new[] { "CameraIp", "EventDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_CameraEvents_EventDateTime",
                table: "CameraEvents",
                column: "EventDateTime");

            migrationBuilder.CreateIndex(
                name: "IX_CameraEvents_Type_State_DateTime",
                table: "CameraEvents",
                columns: new[] { "EventType", "EventState", "EventDateTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CameraEvents");
        }
    }
}
