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
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Curso>()
				.Property(c => c.Status)
				.HasConversion<string>();
			modelBuilder.Entity<Modulo>()
				.Property(m => m.Status)
				.HasConversion<string>();
			modelBuilder.Entity<Aula>()
				.Property(a => a.Status)
				.HasConversion<string>();
			modelBuilder.Entity<AlunoModuloProgresso>()
				.HasKey(amp => new { amp.IdAluno, amp.IdModulo });
			modelBuilder.Entity<AlunoModuloProgresso>()
				.HasOne(amp => amp.Aluno)
				.WithMany(a => a.AlunoModuloProgresso)
				.HasForeignKey(amp => amp.IdAluno);
			modelBuilder.Entity<AlunoModuloProgresso>()
				.HasOne(amp => amp.Modulo)
				.WithMany(m => m.AlunoModuloProgressos)
				.HasForeignKey(amp => amp.IdModulo);
			base.OnModelCreating(modelBuilder);
		}
		public DbSet<Aluno> Alunos => Set<Aluno>();
		public DbSet<Ranking> Rankings => Set<Ranking>();
		public DbSet<DesafioJcc> DesafioJcc => Set<DesafioJcc>();
		public DbSet<GuestUser> GuestUsers => Set<GuestUser>();

		public DbSet<Curso> Cursos => Set<Curso>();
		public DbSet<Modulo> Modulos => Set<Modulo>();
		public DbSet<Aula> Aulas => Set<Aula>();
		public DbSet<AlunoModuloProgresso> Progresso => Set<AlunoModuloProgresso>();
		public DbSet<AlunoAulaProgresso> AulaProgresso => Set<AlunoAulaProgresso>();
	}
}
