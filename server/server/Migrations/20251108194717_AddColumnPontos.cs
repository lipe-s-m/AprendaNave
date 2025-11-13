using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class AddColumnPontos : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{

			migrationBuilder.AlterColumn<string>(
				 name: "descricao",
				 table: "curso",
				 type: "text",
				 nullable: true,
				 oldClrType: typeof(string),
				 oldType: "text");

			migrationBuilder.AddColumn<int>(
				 name: "pontos",
				 table: "aluno",
				 type: "integer",
				 nullable: false,
				 defaultValue: 0);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				 name: "playlist",
				 table: "modulo");

			migrationBuilder.DropColumn(
				 name: "pontos",
				 table: "aluno");

			migrationBuilder.AlterColumn<string>(
				 name: "descricao",
				 table: "curso",
				 type: "text",
				 nullable: false,
				 defaultValue: "",
				 oldClrType: typeof(string),
				 oldType: "text",
				 oldNullable: true);
		}
	}
}
