using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class CursoService : ICursoService
	{
		private readonly DbContexto _context;
		public CursoService(DbContexto context)
		{
			_context = context;
		}


		//requisicoes
		public Curso CreateCurso(Curso curso)
		{
			_context.Add(curso);
			_context.SaveChanges();

			return curso;
		}

		public void DeleteById(Curso curso)
		{
			_context.Cursos.Remove(curso);
			_context.SaveChanges();
		}

		public List<Curso> GetAllCursos(int pagina = 1)
		{
			var query = _context.Cursos.AsQueryable();

			int itensPorPagina = 6;

			var itensList = query.Skip((pagina - 1) * itensPorPagina).Take(itensPorPagina);
			return itensList.ToList();
		}

		public Curso? GetById(int id)
		{
			var res = _context.Cursos.Where(c => c.Id == id).FirstOrDefault();
			if (res != null)
			{
				return res;
			}
			return null;
		}
	}
}
