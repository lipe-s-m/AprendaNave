using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class Modulo : IAuditableEntity
	{
		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public string Nome { get; set; } = default!;

		[Required]
		[StringLength(255)]
		public string Descricao { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public int Ordem { get; set; } = default!;

		[Required]
		[StringLength(25)]
		public int Nivel { get; set; } = default!;

		[Required]
		[StringLength(50)]
		public int QuantidadeAulas { get; set; } = default!;

		[Range(0, 15)]
		[Required]
		public int QuantidadeHoras { get; set; } = default!;

		[Column("playlist")]
		public string? Playlist { get; set; }

		public StatusAprovacao Status { get; set; } = StatusAprovacao.Pendente;

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }


		//relacionamentos
		public int CursoId { get; set; }
		public Curso Curso { get; set; } = default!;
		public ICollection<AlunoModuloProgresso> AlunoModuloProgressos = [];

	}
}
