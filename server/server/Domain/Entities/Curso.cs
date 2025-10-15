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
		public string Professor { get; set; } = default!;

		public ICollection<Modulo> Modulos { get; set; } = [];

	}
}
