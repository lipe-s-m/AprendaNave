using Microsoft.EntityFrameworkCore;
using server.Domain.Entities;

namespace server.Repository.Database
{
	public class DbContexto : DbContext
	{

		public DbContexto(DbContextOptions options) : base(options)
		{
		}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Aluno>().HasData(
				new Aluno
				{
					Id = 1,
					Nome = "UsuarioTeste1",
					Email = "UsuarioTeste1@aprendanave.com",
					Senha = "SenhaUsuarioTeste123",
					cargo = "Aluno"
				}
				);
		}
		//protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		//{
		//	base.OnConfiguring(optionsBuilder);
		//	optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=aprendanavedb;User Id=postgres;Password=ROOT;");
		//}

		public DbSet<Aluno> Aluno => Set<Aluno>();
		//protected override void OnModelCreating(ModelBuilder modelBuilder)
		//{
		//	// ESTE É O CÓDIGO MÁGICO:
		//	modelBuilder.HasDefaultSchema("public");

		//	base.OnModelCreating(modelBuilder);
		//}
	}
}
