using server.Domain.DTOs;

namespace server.Domain.Interfaces
{
	public interface IRanking
	{
		public Task<RankingDTO> AtualizarPontuacaoAluno(int idAluno, string nomeAluno, int pontos, string Modalidade);
		public Task<List<RankingDTO>> ObterRankingPorModalidade(string Modalidade);
		public Task<RankingDTO> ObterPontuacaoAluno(int idAluno, string Modalidade);
		public Task<List<RankingDTO>> ObterTodosAlunosComPontuacao(string Modalidade);
	}
}
