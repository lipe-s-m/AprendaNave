using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class Aula
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; }
		[Required]
		[StringLength(100)]
		public string Titulo { get; set; } = default!;

		[Required]
		[StringLength(255)]
		public string Descricao { get; set; } = default!;

		[Required]
		[Range(1, int.MaxValue, ErrorMessage = "A ordem deve ser maior ou igual a 1")]
		public int Ordem { get; set; }

		public int? Duracao { get; set; } = default!;

		public StatusAprovacao Status { get; set; } = StatusAprovacao.Pendente;

		[Required]
		public string VideoYoutubeId { get; set; } = default!;
		//relacionamentos
		public int ModuloId { get; set; }
		public Modulo Modulo { get; set; } = default!;
	}
}
