using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IAulaService
	{
		IEnumerable<AulaResponseDTO> GetAllAulasAprovadasByModuloId(int moduloId);
		AulaResponseDTO GetAulaById(int id);
		Task<Aula> CreateAula(AulaRequestDTO aulaRequestDTO);
		Task<int> MarcarAulaComoConcluida(int idAula, int idModulo);
	}
}
