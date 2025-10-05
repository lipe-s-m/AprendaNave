using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class ModulosERelacionamentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Modulos",
                schema: "public",
                table: "Cursos");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Alunos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CursoId",
                schema: "public",
                table: "Alunos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdatedAt",
                schema: "public",
                table: "Alunos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Modulo",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Ordem = table.Column<int>(type: "integer", maxLength: 50, nullable: false),
                    Nivel = table.Column<int>(type: "integer", maxLength: 25, nullable: false),
                    QuantidadeAulas = table.Column<int>(type: "integer", maxLength: 50, nullable: false),
                    QuantidadeHoras = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CursoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Modulo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Modulo_Cursos_CursoId",
                        column: x => x.CursoId,
                        principalSchema: "public",
                        principalTable: "Cursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AlunoModuloProgresso",
                schema: "public",
                columns: table => new
                {
                    IdAluno = table.Column<int>(type: "integer", nullable: false),
                    IdModulo = table.Column<int>(type: "integer", nullable: false),
                    AlunoId = table.Column<int>(type: "integer", nullable: false),
                    ModuloId = table.Column<int>(type: "integer", nullable: false),
                    StatusProgresso = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlunoModuloProgresso", x => new { x.IdAluno, x.IdModulo });
                    table.ForeignKey(
                        name: "FK_AlunoModuloProgresso_Alunos_AlunoId",
                        column: x => x.AlunoId,
                        principalSchema: "public",
                        principalTable: "Alunos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlunoModuloProgresso_Modulo_ModuloId",
                        column: x => x.ModuloId,
                        principalSchema: "public",
                        principalTable: "Modulo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "Alunos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "CursoId", "LastUpdatedAt" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Alunos_CursoId",
                schema: "public",
                table: "Alunos",
                column: "CursoId");

            migrationBuilder.CreateIndex(
                name: "IX_AlunoModuloProgresso_AlunoId",
                schema: "public",
                table: "AlunoModuloProgresso",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_AlunoModuloProgresso_ModuloId",
                schema: "public",
                table: "AlunoModuloProgresso",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_Modulo_CursoId",
                schema: "public",
                table: "Modulo",
                column: "CursoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Alunos_Cursos_CursoId",
                schema: "public",
                table: "Alunos",
                column: "CursoId",
                principalSchema: "public",
                principalTable: "Cursos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alunos_Cursos_CursoId",
                schema: "public",
                table: "Alunos");

            migrationBuilder.DropTable(
                name: "AlunoModuloProgresso",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Modulo",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_Alunos_CursoId",
                schema: "public",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "CursoId",
                schema: "public",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "LastUpdatedAt",
                schema: "public",
                table: "Alunos");

            migrationBuilder.AddColumn<int>(
                name: "Modulos",
                schema: "public",
                table: "Cursos",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
