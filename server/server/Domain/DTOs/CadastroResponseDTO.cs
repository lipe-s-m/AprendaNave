namespace server.Domain.DTOs
{
	public class CadastroResponseDTO
	{
		public int id { get; set; } = default!;
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public string Cargo { get; set; } = default!;
	}
}
