using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class Curso
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public string Nome { get; set; } = default!;

		[Required]
		public string Logo { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public string AutorNome { get; set; } = default!;

		[Required]
		public int AutorId { get; set; } = default!;

		public string Descricao { get; set; } = default!;
		public StatusAprovacao Status { get; set; } = StatusAprovacao.Pendente;
		public ICollection<Modulo> Modulos { get; set; } = [];
	}
}
