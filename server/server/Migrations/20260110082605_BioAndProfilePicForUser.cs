using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class BioAndProfilePicForUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "bio",
                table: "aluno",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "foto_perfil",
                table: "aluno",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bio",
                table: "aluno");

            migrationBuilder.DropColumn(
                name: "foto_perfil",
                table: "aluno");
        }
    }
}
