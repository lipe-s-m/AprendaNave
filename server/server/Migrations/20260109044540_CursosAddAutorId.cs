using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class CursosAddAutorId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "autor",
                table: "curso",
                newName: "autor_nome");

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                table: "curso",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "autor_id",
                table: "curso",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "autor_id",
                table: "curso");

            migrationBuilder.RenameColumn(
                name: "autor_nome",
                table: "curso",
                newName: "autor");

            migrationBuilder.AlterColumn<string>(
                name: "descricao",
                table: "curso",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
