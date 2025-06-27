using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoobleDrive.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoritesToFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FavoritedBy",
                table: "Files",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FavoritedBy",
                table: "Files");
        }
    }
} 