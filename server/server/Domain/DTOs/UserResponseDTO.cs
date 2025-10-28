using server.Domain.Entities;

namespace server.Domain.DTOs
{
	public class UserResponseDTO
	{
		public int Id { get; set; } = default!;
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public string Cargo { get; set; } = default!;
		public ICollection<AlunoModuloProgresso> AlunoModuloProgresso = [];
		public UserResponseDTO(string nome, string email, string cargo)
		{
			Nome = nome;
			Email = email;
			Cargo = cargo;
		}
	}
}
