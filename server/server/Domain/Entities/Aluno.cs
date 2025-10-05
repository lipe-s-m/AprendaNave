using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class Aluno : IAuditableEntity
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public string Nome { get; set; } = default!;

		[Required]
		[EmailAddress]
		[StringLength(60)]
		public string Email { get; set; } = default!;

		[StringLength(40)]
		[Required]
		public string Senha { get; set; } = default!;

		[StringLength(20)]
		public string cargo { get; set; } = "Aluno";

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }


		public ICollection<Curso> Cursos = [];
		public ICollection<AlunoModuloProgresso> AlunoModuloProgresso = [];

	}
}
