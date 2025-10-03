namespace server.Domain.DTOs
{
	public class CadastroRequestDTO
	{

		public string Nome { get; set; } = default!;
		public string Email { get; set; } = default!;
		public string Senha { get; set; } = default!;
		public string SenhaConfirmacao { get; set; } = default!;
	}
}
