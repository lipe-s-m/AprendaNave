namespace server.Domain.DTOs
{
	public class AulaResponseDTO
	{
		public int IdAula { get; set; }
		public string TituloAula { get; set; }
		public string DescricaoAula { get; set; }
		public int OrdemAula { get; set; }
		public int? DuracaoAula { get; set; }
		public string VideoYoutubeIdAula { get; set; }
		public int IdModulo { get; set; }
		public AulaResponseDTO(int idAula, string tituloAula, string descricaoAula, int ordemAula, int? duracaoAula, string videoYoutubeIdAula, int idModulo)
		{
			IdAula = idAula;
			TituloAula = tituloAula;
			DescricaoAula = descricaoAula;
			OrdemAula = ordemAula;
			DuracaoAula = duracaoAula;
			VideoYoutubeIdAula = videoYoutubeIdAula;
			IdModulo = idModulo;

		}
	}
}
