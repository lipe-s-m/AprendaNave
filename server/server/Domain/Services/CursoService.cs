using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
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
		public Curso CreateCurso(CursoRequestDTO cursoRequest, int userId)
		{
			var curso = new Curso
			{
				Nome = cursoRequest.Nome,
				AutorNome = cursoRequest.AutorNome,
				AutorId = userId,
				Logo = cursoRequest.Logo,
				Descricao = cursoRequest.Descricao
			};

			_context.Add(curso);
			_context.SaveChanges();

			return curso;
		}

		public void DeleteById(Curso curso)
		{
			_context.Cursos.Remove(curso);
			_context.SaveChanges();
		}

		public List<Curso> GetCursosAprovados(int pagina = 1)
		{
			var query = _context.Cursos.Where(c => c.Status == StatusAprovacao.Aprovado).AsQueryable();

			int itensPorPagina = 6;

			var itensList = query.Skip((pagina - 1) * itensPorPagina).Take(itensPorPagina);
			return itensList.ToList();
		}

		public Curso? GetCursoById(int id)
		{
			var res = _context.Cursos.Where(c => c.Id == id).FirstOrDefault();
			if (res != null)
			{
				return res;
			}
			return null;
		}

		public async Task<IEnumerable<CursoResponseDTO>> getCursosByUserId(int userId)
		{
			var cursosResponse = await _context.Cursos.Where(c => c.AutorId == userId).Select(c => new CursoResponseDTO(c)).ToListAsync();

			return cursosResponse;
		}
	}
}
