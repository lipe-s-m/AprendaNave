using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class AulaService : IAulaService
	{
		private readonly DbContexto dbContext;

		public AulaService(DbContexto context)
		{
			dbContext = context;
		}
		public IEnumerable<AulaResponseDTO> getAllAulasByModuloId(int moduloId)
		{
			var res = dbContext.Aulas.Where(a => a.ModuloId == moduloId).ToList();
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
		public AulaResponseDTO getAulaById(int id)
		{
			var aula = dbContext.Aulas.FirstOrDefault(a => a.Id == id);
			if (aula == null) return null;
			return new AulaResponseDTO(aula.Id, aula.Titulo, aula.Descricao, aula.Ordem, aula.Duracao, aula.VideoYoutubeId, aula.ModuloId);
		}
	}
}
