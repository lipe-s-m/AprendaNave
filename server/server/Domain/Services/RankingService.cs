using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class RankingService : IRanking
	{
		private readonly DbContexto dbContexto;
		public RankingService(DbContexto _dbContexto)
		{
			this.dbContexto = _dbContexto;
		}

		public async Task<RankingDTO> AtualizarPontuacaoAluno(int idAluno, string nomeAluno, int pontos, string modalidade)
		{
			if (pontos < 0)
			{
				throw new ArgumentException("A pontuação não pode ser negativa.");
			}
			if (idAluno <= 0)
			{
				throw new ArgumentException("O ID do aluno deve ser um número positivo.");
			}
			//se os params estiverem ok
			{
				var response = await dbContexto.Rankings.Where(d => d.IdAluno == idAluno && d.NomeAluno == nomeAluno && d.Modalidade == modalidade).FirstOrDefaultAsync();
				//criar novo registro se não existir
				if (response == null)
				{
					dbContexto.Rankings.Add(new Ranking { IdAluno = idAluno, NomeAluno = nomeAluno, Pontos = pontos, Modalidade = modalidade });
					RankingDTO novoAlunoRanking = new RankingDTO(idAluno, nomeAluno, pontos, modalidade);
					await dbContexto.SaveChangesAsync();
					return novoAlunoRanking;
				}
				//atualizar pontos se existir registro
				else
				{
					response.Pontos = pontos;
					RankingDTO rankingDTO = new RankingDTO(response.IdAluno, response.NomeAluno, response.Pontos, response.Modalidade);
					await dbContexto.SaveChangesAsync();
					return rankingDTO;
				}

			}
		}
		public async Task<RankingDTO> ObterPontuacaoAluno(int idAluno, string modalidade)
		{
			var response = await dbContexto.Rankings.FindAsync(idAluno, modalidade);
			if (response == null)
			{
				throw new ArgumentException("Aluno não encontrado");
			}
			RankingDTO rankingDTO = new RankingDTO(response.IdAluno, response.NomeAluno, response.Pontos, response.Modalidade);
			return rankingDTO;
		}

		public Task<List<RankingDTO>> ObterRankingPorModalidade(string modalidade)
		{
			var response = dbContexto.Rankings
				.AsNoTracking()
				.Where(d => d.Modalidade == modalidade)
				.OrderByDescending(d => d.Pontos)
				.Take(5)
				.Select(d => new RankingDTO(d.IdAluno, d.NomeAluno, d.Pontos, d.Modalidade))
				.ToListAsync();
			if (response == null)
			{
				throw new ArgumentException("Nenhum aluno encontrado");
			}
			return response;
		}

		public async Task<List<RankingDTO>> ObterTodosAlunosComPontuacao(string modalidade)
		{
			var response = await dbContexto.Rankings.Where(d => d.Modalidade == modalidade).ToListAsync();
			if (response == null)
			{
				throw new ArgumentException("Nenhum aluno encontrado");
			}
			var listaRankingDTO = response.Select(d => new RankingDTO(d.IdAluno, d.NomeAluno, d.Pontos, d.Modalidade)).ToList();
			return listaRankingDTO;
		}
	}
}
