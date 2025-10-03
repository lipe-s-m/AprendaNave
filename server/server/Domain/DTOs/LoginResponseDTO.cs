namespace server.Domain.DTOs
{
	public class LoginResponseDTO
	{

		public string TokenJWT { get; set; } = default!;
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public int Id { get; set; } = default!;
	}
}
