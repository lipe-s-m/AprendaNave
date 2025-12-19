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
		public int Ordem { get; set; }

		public int? Duracao { get; set; } = default!;

		[Required]
		public string VideoYoutubeId { get; set; } = default!;
		//relacionamentos
		public int ModuloId { get; set; }
		public Modulo Modulo { get; set; } = default!;
	}
}
