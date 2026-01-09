using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class AulaService : IAulaService
	{
		private readonly DbContexto dbContext;
		private readonly ICurrentUser currentUser;

		public AulaService(DbContexto context, ICurrentUser _currentUser)
		{
			dbContext = context;
			this.currentUser = _currentUser;
		}

		public async Task<Aula> CreateAula(AulaRequestDTO aulaRequestDTO)
		{
			if (aulaRequestDTO.Ordem < 1) throw new ArgumentOutOfRangeException("A ordem deve ser maior ou igual a 1");
			Aula aula = new Aula()
			{
				Titulo = aulaRequestDTO.Titulo,
				Descricao = aulaRequestDTO.Descricao,
				Duracao = aulaRequestDTO.Duracao,
				ModuloId = aulaRequestDTO.IdModulo,
				Ordem = aulaRequestDTO.Ordem,
				VideoYoutubeId = aulaRequestDTO.VideoYoutubeId,
			};
			if (aula != null)
			{
				await dbContext.Aulas.AddAsync(aula);
				dbContext.SaveChanges();
				return aula;
			}
			throw new NullReferenceException();
		}

		public IEnumerable<AulaResponseDTO> GetAllAulasAprovadasByModuloId(int moduloId)
		{
			var res = dbContext.Aulas.Where(a => a.ModuloId == moduloId && a.Status == StatusAprovacao.Aprovado).ToList();
			var aulaDTOs = res.Select(aula => new AulaResponseDTO(
				aula.Id,
				aula.Titulo,
				aula.Descricao,
				aula.Ordem,
				aula.Duracao,
				aula.VideoYoutubeId,
				aula.ModuloId)
			).ToList();

			return aulaDTOs;
		}
		public AulaResponseDTO GetAulaById(int id)
		{
			var aula = dbContext.Aulas.FirstOrDefault(a => a.Id == id);
			if (aula == null) return null;
			return new AulaResponseDTO(aula.Id, aula.Titulo, aula.Descricao, aula.Ordem, aula.Duracao, aula.VideoYoutubeId, aula.ModuloId);
		}

		public async Task<int> MarcarAulaComoConcluida(int idAula, int idModulo)
		{
			int idAluno = currentUser.Id;
			var aulasConcluidas = this.dbContext.AulaProgresso.Add(new AlunoAulaProgresso(idAluno, idAula, idModulo));
			await this.dbContext.SaveChangesAsync();

			return idAula;
		}

	}
}
