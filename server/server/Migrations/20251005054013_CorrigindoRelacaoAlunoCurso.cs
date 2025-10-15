using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class CorrigindoRelacaoAlunoCurso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Cursos",
                schema: "public",
                table: "Cursos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Alunos",
                schema: "public",
                table: "Alunos");

            migrationBuilder.DropColumn(
                name: "Modulos",
                schema: "public",
                table: "Cursos");

            migrationBuilder.RenameTable(
                name: "Cursos",
                schema: "public",
                newName: "curso",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "Alunos",
                schema: "public",
                newName: "aluno",
                newSchema: "public");

            migrationBuilder.RenameColumn(
                name: "Professor",
                schema: "public",
                table: "curso",
                newName: "professor");

            migrationBuilder.RenameColumn(
                name: "Nome",
                schema: "public",
                table: "curso",
                newName: "nome");

            migrationBuilder.RenameColumn(
                name: "Logo",
                schema: "public",
                table: "curso",
                newName: "logo");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "public",
                table: "curso",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Senha",
                schema: "public",
                table: "aluno",
                newName: "senha");

            migrationBuilder.RenameColumn(
                name: "Nome",
                schema: "public",
                table: "aluno",
                newName: "nome");

            migrationBuilder.RenameColumn(
                name: "Email",
                schema: "public",
                table: "aluno",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "public",
                table: "aluno",
                newName: "id");

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                schema: "public",
                table: "aluno",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "last_updated_at",
                schema: "public",
                table: "aluno",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_curso",
                schema: "public",
                table: "curso",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_aluno",
                schema: "public",
                table: "aluno",
                column: "id");

            migrationBuilder.CreateTable(
                name: "modulo",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    descricao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ordem = table.Column<int>(type: "integer", maxLength: 50, nullable: false),
                    nivel = table.Column<int>(type: "integer", maxLength: 25, nullable: false),
                    quantidade_aulas = table.Column<int>(type: "integer", maxLength: 50, nullable: false),
                    quantidade_horas = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    curso_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_modulo", x => x.id);
                    table.ForeignKey(
                        name: "fk_modulo_curso_curso_id",
                        column: x => x.curso_id,
                        principalSchema: "public",
                        principalTable: "curso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aluno_modulo_progresso",
                schema: "public",
                columns: table => new
                {
                    id_aluno = table.Column<int>(type: "integer", nullable: false),
                    id_modulo = table.Column<int>(type: "integer", nullable: false),
                    aluno_id = table.Column<int>(type: "integer", nullable: false),
                    modulo_id = table.Column<int>(type: "integer", nullable: false),
                    status_progresso = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aluno_modulo_progresso", x => new { x.id_aluno, x.id_modulo });
                    table.ForeignKey(
                        name: "fk_aluno_modulo_progresso_aluno_aluno_id",
                        column: x => x.aluno_id,
                        principalSchema: "public",
                        principalTable: "aluno",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_aluno_modulo_progresso_modulo_modulo_id",
                        column: x => x.modulo_id,
                        principalSchema: "public",
                        principalTable: "modulo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "aluno",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "created_at", "last_updated_at" },
                values: new object[] { new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null });

            migrationBuilder.CreateIndex(
                name: "ix_aluno_modulo_progresso_aluno_id",
                schema: "public",
                table: "aluno_modulo_progresso",
                column: "aluno_id");

            migrationBuilder.CreateIndex(
                name: "ix_aluno_modulo_progresso_modulo_id",
                schema: "public",
                table: "aluno_modulo_progresso",
                column: "modulo_id");

            migrationBuilder.CreateIndex(
                name: "ix_modulo_curso_id",
                schema: "public",
                table: "modulo",
                column: "curso_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aluno_modulo_progresso",
                schema: "public");

            migrationBuilder.DropTable(
                name: "modulo",
                schema: "public");

            migrationBuilder.DropPrimaryKey(
                name: "pk_curso",
                schema: "public",
                table: "curso");

            migrationBuilder.DropPrimaryKey(
                name: "pk_aluno",
                schema: "public",
                table: "aluno");

            migrationBuilder.DropColumn(
                name: "created_at",
                schema: "public",
                table: "aluno");

            migrationBuilder.DropColumn(
                name: "last_updated_at",
                schema: "public",
                table: "aluno");

            migrationBuilder.RenameTable(
                name: "curso",
                schema: "public",
                newName: "Cursos",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "aluno",
                schema: "public",
                newName: "Alunos",
                newSchema: "public");

            migrationBuilder.RenameColumn(
                name: "professor",
                schema: "public",
                table: "Cursos",
                newName: "Professor");

            migrationBuilder.RenameColumn(
                name: "nome",
                schema: "public",
                table: "Cursos",
                newName: "Nome");

            migrationBuilder.RenameColumn(
                name: "logo",
                schema: "public",
                table: "Cursos",
                newName: "Logo");

            migrationBuilder.RenameColumn(
                name: "id",
                schema: "public",
                table: "Cursos",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "senha",
                schema: "public",
                table: "Alunos",
                newName: "Senha");

            migrationBuilder.RenameColumn(
                name: "nome",
                schema: "public",
                table: "Alunos",
                newName: "Nome");

            migrationBuilder.RenameColumn(
                name: "email",
                schema: "public",
                table: "Alunos",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                schema: "public",
                table: "Alunos",
                newName: "Id");

            migrationBuilder.AddColumn<int>(
                name: "Modulos",
                schema: "public",
                table: "Cursos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Cursos",
                schema: "public",
                table: "Cursos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Alunos",
                schema: "public",
                table: "Alunos",
                column: "Id");
        }
    }
}
