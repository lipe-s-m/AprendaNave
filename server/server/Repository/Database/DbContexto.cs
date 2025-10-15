using Microsoft.EntityFrameworkCore;
using server.Domain.Entities;
using server.Domain.Interfaces;

namespace server.Repository.Database
{
	public class DbContexto : DbContext
	{

		public DbContexto(DbContextOptions options) : base(options)
		{
		}

		public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
		{
			var entries = ChangeTracker
				.Entries()
				.Where(e => e.Entity is IAuditableEntity && (
					e.State == EntityState.Added ||
					e.State == EntityState.Modified
				));
			foreach (var entityEntry in entries)
			{
				((IAuditableEntity)entityEntry.Entity).LastUpdatedAt = DateTime.UtcNow;
				if (entityEntry.State == EntityState.Added)
				{
					((IAuditableEntity)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
				}
			}
			return base.SaveChangesAsync(cancellationToken);
		}
		//protected override void OnModelCreating(ModelBuilder modelBuilder)
		//{
		//	modelBuilder.Entity<Aluno>().HasData(
		//		new Aluno(
		//			"UsuarioTeste1",
		//			"UsuarioTeste1@aprendanave.com",
		//			"SenhaUsuarioTeste123",
		//			"Aluno")
		//		);

		//	modelBuilder.Entity<AlunoModuloProgresso>()
		//		.HasKey(el => new
		//		{ el.IdAluno, el.IdModulo });

		//	var statusConverter = new EnumToStringConverter<StatusProgressoEnum>();
		//	modelBuilder.Entity<AlunoModuloProgresso>()
		//		.Property(el => el.StatusProgresso)
		//		.HasConversion(statusConverter);




		//	modelBuilder.HasDefaultSchema("public");

		//	base.OnModelCreating(modelBuilder);
		//}



		public DbSet<Aluno> Alunos => Set<Aluno>();
		public DbSet<Curso> Cursos => Set<Curso>();
		public DbSet<Modulo> Modulos => Set<Modulo>();

	}
}
