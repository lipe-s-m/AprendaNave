using server.Domain.Entities;

namespace server.Domain.DTOs
{
	public class CursoResponseDTO
	{
		public int Id { get; set; }
		public string Nome { get; set; } = default!;
		public string Logo { get; set; } = default!;
		public string AutorNome { get; set; } = default!;
		public int AutorId { get; set; } = default!;
		public string Descricao { get; set; } = default!;
		public StatusAprovacao StatusAprovacao { get; set; } = default!;

		public CursoResponseDTO(Curso curso)
		{
			Id = curso.Id;
			Nome = curso.Nome;
			Logo = curso.Logo;
			AutorId = curso.AutorId;
			AutorNome = curso.AutorNome;
			Descricao = curso.Descricao;
			StatusAprovacao = curso.Status;
		}
	}
}
