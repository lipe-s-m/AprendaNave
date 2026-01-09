using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class StatusCurso : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				 name: "status",
				 table: "curso",
				 type: "text",
				 nullable: false,
				 defaultValue: "");
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(
				 name: "status",
				 table: "curso");
		}

	}
}
