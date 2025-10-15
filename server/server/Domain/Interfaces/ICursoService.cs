using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface ICursoService
	{
		List<Curso> GetAllCursos(int pagina = 1);
		Curso? GetCursoById(int id);
		Curso CreateCurso(Curso curso);
		void DeleteById(Curso curso);
	}
}
