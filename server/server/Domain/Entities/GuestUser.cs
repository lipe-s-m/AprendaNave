using server.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Domain.Entities
{
	public class GuestUser : IAuditableEntity
	{
		[Key]
		[Required]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		public int Id { get; set; }

		[Required]
		public string Nome { get; set; }
		public string Contato { get; set; }

		public GuestUser(string nome, string contato)
		{
			Nome = nome;
			Contato = contato;
		}

		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }
	}
}