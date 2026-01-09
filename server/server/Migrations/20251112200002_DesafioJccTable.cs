using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class DesafioJccTable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				 name: "desafio_jcc",
				 columns: table => new
				 {
					 id_aluno = table.Column<int>(type: "integer", nullable: false),
					 nome_aluno = table.Column<string>(type: "text", nullable: false),
					 pontos = table.Column<int>(type: "integer", nullable: false),
					 created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					 last_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
				 },
				 constraints: table =>
				 {
					 table.PrimaryKey("desafio_jcc_pkey", x => x.id_aluno);
					 table.ForeignKey(
							  name: "id_aluno",
							  column: x => x.id_aluno,
							  principalTable: "aluno",
							  principalColumn: "id",
							  onDelete: ReferentialAction.Cascade);
				 });
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				 name: "desafio_jcc");
		}
	}
}
