namespace server.Domain.DTOs
{
	public class RankingDTO
	{
		public int IdAluno { get; set; }
		public string NomeAluno { get; set; }
		public int PontuacaoAluno { get; set; }
		public string Modalidade { get; set; }
		public RankingDTO(int idAluno, string nomeAluno, int pontuacaoAluno, string modalidade)
		{
			IdAluno = idAluno;
			NomeAluno = nomeAluno;
			PontuacaoAluno = pontuacaoAluno;
			Modalidade = modalidade;
		}

	}
}

