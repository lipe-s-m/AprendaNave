namespace server.Domain.DTOs
{
	public class CadastroResponseDTO
	{
		public int Id { get; set; } = default!;
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public string Cargo { get; set; } = default!;

		public CadastroResponseDTO(int id, string nome, string email, string cargo)
		{
			this.Id = id;
			Nome = nome;
			Email = email;
			Cargo = cargo;
		}
	}
}
