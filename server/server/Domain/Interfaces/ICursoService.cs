using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface ICursoService
	{
		List<Curso> GetCursosAprovados(int pagina = 1);
		Curso? GetCursoById(int id);
		Task<IEnumerable<CursoResponseDTO>> getCursosByUserId(int userId);
		Curso CreateCurso(CursoRequestDTO cursoRequestDTO, int userId);
		void DeleteById(Curso curso);
	}
}
