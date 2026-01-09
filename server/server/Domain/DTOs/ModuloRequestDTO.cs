namespace server.Domain.DTOs
{
	public class ModuloRequestDTO
	{
		public string Nome { get; set; } = default!;
		public int Ordem { get; set; } = default!;
		public int Nivel { get; set; } = default!;
		public string Descricao { get; set; } = default!;
		public int QuantidadeAulas { get; set; } = default!;
		public int? QuantidadeHoras { get; set; } = default!;
		public int CursoId { get; set; } = default!;


	}
}
