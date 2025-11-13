using server.Domain.Entities;

namespace server.Domain.DTOs
{
	public class UserResponseDTO
	{
		public int Id { get; set; } = default!;
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public string Cargo { get; set; } = default!;
		public int Pontos { get; set; } = 0!;
		public ICollection<AlunoModuloProgresso> AlunoModuloProgresso = [];
		public UserResponseDTO(string nome, string email, string cargo, int pontos)
		{
			Nome = nome;
			Email = email;
			Cargo = cargo;
			Pontos = pontos;
		}
	}
}
