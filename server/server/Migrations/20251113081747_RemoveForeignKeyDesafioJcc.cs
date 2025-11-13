using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class RemoveForeignKeyDesafioJcc : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropForeignKey(
				 name: "fk_desafio_jcc_aluno_id_aluno",
				 table: "desafio_jcc");

			migrationBuilder.AlterColumn<int>(
				 name: "id_aluno",
				 table: "desafio_jcc",
				 type: "integer",
				 nullable: false,
				 oldClrType: typeof(int),
				 oldType: "integer")
				 .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<int>(
				 name: "id_aluno",
				 table: "desafio_jcc",
				 type: "integer",
				 nullable: false,
				 oldClrType: typeof(int),
				 oldType: "integer")
				 .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AddForeignKey(
				 name: "fk_desafio_jcc_aluno_id_aluno",
				 table: "desafio_jcc",
				 column: "id_aluno",
				 principalTable: "aluno",
				 principalColumn: "id",
				 onDelete: ReferentialAction.Cascade);
		}
	}
}
