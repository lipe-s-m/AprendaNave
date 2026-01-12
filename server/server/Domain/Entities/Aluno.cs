using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace server.Domain.Entities
{
	public class Aluno : IAuditableEntity
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; } = default!;

		[Required]
		[StringLength(60)]
		public string Nome { get; set; } = default!;

		[AllowNull]
		public string? Bio { get; set; } = default!;

		[AllowNull]
		public string? FotoPerfil { get; set; } = default!;

		[Required]
		[EmailAddress]
		[StringLength(100)]
		public string Email { get; set; } = default!;

		[StringLength(255)]
		[Required]
		public string Senha { get; set; } = default!;

		[StringLength(20)]
		public string Cargo { get; set; } = "Visitante";

		public int Pontos { get; set; } = 0;

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }


		public ICollection<AlunoModuloProgresso> AlunoModuloProgresso = [];

		public Aluno(string nome, string email, string senha, string cargo)
		{
			Nome = nome;
			Email = email;
			Senha = senha;
			Cargo = cargo;
		}

		public List<Ranking> Rankings { get; set; } = [];
	}
}
