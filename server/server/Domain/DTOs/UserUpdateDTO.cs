namespace server.Domain.DTOs
{
	public class UserUpdateDTO
	{
		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;

		public string? bio { get; set; } = default!;
		public string? fotoPerfil { get; set; } = default!;
	}
}
