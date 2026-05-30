using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCompanyTinNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [SystemSettings]
                WHERE [Key] = N'company.tinNumber';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM [SystemSettings]
                    WHERE [Key] = N'company.tinNumber'
                )
                BEGIN
                    INSERT INTO [SystemSettings] (
                        [Key],
                        [Value],
                        [Group],
                        [Description],
                        [IsEncrypted],
                        [CreatedAt],
                        [CreatedByUserId],
                        [LastModifiedAt],
                        [LastModifiedByUserId]
                    )
                    VALUES (
                        N'company.tinNumber',
                        NULL,
                        N'Company Information',
                        N'Registered TIN number.',
                        CAST(0 AS bit),
                        SYSDATETIMEOFFSET(),
                        NULL,
                        NULL,
                        NULL
                    );
                END
                """);
        }
    }
}
