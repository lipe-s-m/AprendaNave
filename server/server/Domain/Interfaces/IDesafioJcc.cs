using server.Domain.DTOs;

namespace server.Domain.Interfaces
{
	public interface IDesafioJcc
	{
		public Task<DesafioJccDTO> AtualizarPontuacaoAluno(int idAluno, string nomeAluno, int pontos);
		public Task<List<DesafioJccDTO>> ObterRankingDesafioJcc();
		public Task<DesafioJccDTO> ObterPontuacaoAluno(int idAluno);
		public Task<List<DesafioJccDTO>> ObterTodosAlunosComPontuacao();
	}
}
