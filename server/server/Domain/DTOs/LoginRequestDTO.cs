namespace server.Domain.DTOs
{
	public class LoginRequestDTO
	{
		public string Email { get; set; } = default!;
		public string Senha { get; set; } = default!;
	}
}
