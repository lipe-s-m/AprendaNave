using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class DesafioJccService : IDesafioJcc
	{
		private readonly DbContexto dbContexto;
		public DesafioJccService(DbContexto _dbContexto)
		{
			this.dbContexto = _dbContexto;
		}

		public async Task<DesafioJccDTO> AtualizarPontuacaoAluno(int idAluno, string nomeAluno, int pontos)
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
				var response = await dbContexto.DesafioJcc.FindAsync(idAluno);
				//criar novo registro se não existir
				if (response == null)
				{
					dbContexto.DesafioJcc.Add(new DesafioJcc { IdAluno = idAluno, NomeAluno = nomeAluno, Pontos = pontos });
					DesafioJccDTO novoAlunoDesafio = new DesafioJccDTO(idAluno, nomeAluno, pontos);
					await dbContexto.SaveChangesAsync();
					return novoAlunoDesafio;
				}
				//atualizar pontos se existir registro
				else
				{
					response.Pontos = pontos;
					DesafioJccDTO desafioJccDTO = new DesafioJccDTO(response.IdAluno, response.NomeAluno, response.Pontos);
					await dbContexto.SaveChangesAsync();
					return desafioJccDTO;
				}

			}
		}
		public async Task<DesafioJccDTO> ObterPontuacaoAluno(int idAluno)
		{
			var response = await dbContexto.DesafioJcc.FindAsync(idAluno);
			if (response == null)
			{
				throw new ArgumentException("Aluno não encontrado");
			}
			DesafioJccDTO desafioJccDTO = new DesafioJccDTO(response.IdAluno, response.NomeAluno, response.Pontos);
			return desafioJccDTO;
		}

		public Task<List<DesafioJccDTO>> ObterRankingDesafioJcc()
		{
			var response = dbContexto.DesafioJcc
				.OrderByDescending(d => d.Pontos)
				.Take(5)
				.Select(d => new DesafioJccDTO(d.IdAluno, d.NomeAluno, d.Pontos))
				.ToListAsync();
			if (response == null)
			{
				throw new ArgumentException("Nenhum aluno encontrado");
			}
			return response;
		}

		public async Task<List<DesafioJccDTO>> ObterTodosAlunosComPontuacao()
		{
			var response = await dbContexto.DesafioJcc.ToListAsync();
			if (response == null)
			{
				throw new ArgumentException("Nenhum aluno encontrado");
			}
			var listaDesafioJccDTO = response.Select(d => new DesafioJccDTO(d.IdAluno, d.NomeAluno, d.Pontos)).ToList();
			return listaDesafioJccDTO;
		}
	}
}
