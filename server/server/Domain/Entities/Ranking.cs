using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class Ranking : IAuditableEntity
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; } = default!;

		[Required]
		public int IdAluno { get; set; }

		[Required]
		public string NomeAluno { get; set; }

		public Aluno Aluno { get; set; }

		[Required]
		public string Modalidade { get; set; }

		[Required]
		public int Pontos { get; set; }

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }
	}
}