using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class SeedAluno : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Aluno",
                keyColumn: "Id",
                keyValue: 1,
                column: "Senha",
                value: "SenhaUsuarioTeste123");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Aluno",
                keyColumn: "Id",
                keyValue: 1,
                column: "Senha",
                value: "UsuarioTeste123");
        }
    }
}
