using System.ComponentModel.DataAnnotations;

namespace server.Domain.DTOs
{
	public class CadastroRequestDTO
	{

		public string Nome { get; set; } = default!;

		[EmailAddress]
		public string Email { get; set; } = default!;
		public string Senha { get; set; } = default!;
		public string SenhaConfirmacao { get; set; } = default!;
		public string Cargo { get; set; } = "Aluno";

		public CadastroRequestDTO(string nome, string email, string senha, string senhaConfirmacao, string cargo)
		{
			Nome = nome;
			Email = email;
			Senha = senha;
			SenhaConfirmacao = senhaConfirmacao;
			Cargo = cargo;
		}

	}
}
