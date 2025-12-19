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


		}
	}
}
