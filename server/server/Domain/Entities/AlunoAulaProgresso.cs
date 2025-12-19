using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class AlunoAulaProgresso
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; }

		[Required]
		public int IdAluno { get; set; }
		[Required]
		public int IdAula { get; set; }
		[Required]
		public int IdModulo { get; set; }

		public Aluno Aluno { get; set; } = default!;
		public Aula Aula { get; set; } = default!;
		public Modulo Modulo { get; set; } = default!;
	}
}
