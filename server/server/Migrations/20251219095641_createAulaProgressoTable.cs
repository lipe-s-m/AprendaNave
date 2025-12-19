using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class createAulaProgressoTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "aluno_aula_progresso",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_aluno = table.Column<int>(type: "integer", nullable: false),
                    id_aula = table.Column<int>(type: "integer", nullable: false),
                    id_modulo = table.Column<int>(type: "integer", nullable: false),
                    aluno_id = table.Column<int>(type: "integer", nullable: false),
                    aula_id = table.Column<int>(type: "integer", nullable: false),
                    modulo_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aluno_aula_progresso", x => x.id);
                    table.ForeignKey(
                        name: "fk_aluno_aula_progresso_aluno_aluno_id",
                        column: x => x.aluno_id,
                        principalTable: "aluno",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_aluno_aula_progresso_aula_aula_id",
                        column: x => x.aula_id,
                        principalTable: "aula",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_aluno_aula_progresso_modulo_modulo_id",
                        column: x => x.modulo_id,
                        principalTable: "modulo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_aluno_aula_progresso_aluno_id",
                table: "aluno_aula_progresso",
                column: "aluno_id");

            migrationBuilder.CreateIndex(
                name: "ix_aluno_aula_progresso_aula_id",
                table: "aluno_aula_progresso",
                column: "aula_id");

            migrationBuilder.CreateIndex(
                name: "ix_aluno_aula_progresso_modulo_id",
                table: "aluno_aula_progresso",
                column: "modulo_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aluno_aula_progresso");
        }
    }
}
