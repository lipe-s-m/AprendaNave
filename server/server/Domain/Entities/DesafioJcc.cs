using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace server.Domain.Entities
{
	public class DesafioJcc : IAuditableEntity
	{
		[Key]
		[Required]
		public int IdAluno { get; set; }

		[Key]
		[Required]
		public string NomeAluno { get; set; }


		[Required]
		public int Pontos { get; set; }

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }
	}
}