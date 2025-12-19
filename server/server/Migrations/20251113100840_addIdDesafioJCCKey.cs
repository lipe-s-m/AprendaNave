using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class addIdDesafioJCCKey : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropPrimaryKey(
				 name: "desafio_jcc_pkey",
				 table: "desafio_jcc");

			migrationBuilder.AlterColumn<int>(
				 name: "id_aluno",
				 table: "desafio_jcc",
				 type: "integer",
				 nullable: false,
				 oldClrType: typeof(int),
				 oldType: "integer")
				 .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AddColumn<int>(
				 name: "id",
				 table: "desafio_jcc",
				 type: "integer",
				 nullable: false,
				 defaultValue: 0)
				 .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			migrationBuilder.AddPrimaryKey(
				 name: "desafio_jcc_pkey",
				 table: "desafio_jcc",
				 column: "id");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			//migrationBuilder.DropPrimaryKey(
			//    name: "desafio_jcc_pkey",
			//    table: "desafio_jcc");

			//migrationBuilder.DropColumn(
			//    name: "id",
			//    table: "desafio_jcc");

			//migrationBuilder.AlterColumn<int>(
			//    name: "id_aluno",
			//    table: "desafio_jcc",
			//    type: "integer",
			//    nullable: false,
			//    oldClrType: typeof(int),
			//    oldType: "integer")
			//    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

			//migrationBuilder.AddPrimaryKey(
			//    name: "desafio_jcc_pkey",
			//    table: "desafio_jcc",
			//    column: "id_aluno");
		}
	}
}
