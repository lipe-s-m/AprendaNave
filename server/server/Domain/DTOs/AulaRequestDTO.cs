namespace server.Domain.DTOs
{
	public class AulaRequestDTO
	{
		public string Titulo { get; set; }
		public string Descricao { get; set; }
		public int Ordem { get; set; }
		public int? Duracao { get; set; }
		public string VideoYoutubeId { get; set; }
		public int IdModulo { get; set; }
	}
}
