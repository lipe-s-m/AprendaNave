using server.Domain.DTOs;

namespace server.Domain.Interfaces
{
	public interface IAulaService
	{
		IEnumerable<AulaResponseDTO> getAllAulasByModuloId(int moduloId);
		AulaResponseDTO getAulaById(int id);
	}
}
