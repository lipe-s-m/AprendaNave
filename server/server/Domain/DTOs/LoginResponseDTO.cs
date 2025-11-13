namespace server.Domain.DTOs
{
	public class LoginResponseDTO
	{

		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public int Id { get; set; } = default!;
		public string Cargo { get; set; } = default!;
		public int Pontos { get; set; } = 0;
	}
}
