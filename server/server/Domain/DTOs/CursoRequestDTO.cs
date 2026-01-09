namespace server.Domain.DTOs
{
	public class CursoRequestDTO
	{
		public string Nome { get; set; } = default!;
		public string Logo { get; set; } = default!;
		public string AutorNome { get; set; } = default!;
		public string Descricao { get; set; } = default!;

		public CursoRequestDTO(string nome, string logo, string autorNome, string descricao)
		{
			Nome = nome;
			Logo = logo;
			AutorNome = autorNome;
			Descricao = descricao;
		}
	}
}
