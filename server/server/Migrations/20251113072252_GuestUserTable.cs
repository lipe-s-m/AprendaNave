using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations
{
	/// <inheritdoc />
	public partial class GuestUserTable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				 name: "guest_user",
				 columns: table => new
				 {
					 id = table.Column<int>(type: "integer", nullable: false)
							.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					 nome = table.Column<string>(type: "text", nullable: false),
					 contato = table.Column<string>(type: "text", nullable: false),
					 created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
					 last_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
				 },
				 constraints: table =>
				 {
					 table.PrimaryKey("pk_guest_user", x => x.id);
				 });
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				 name: "guest_user");
		}
	}
}
