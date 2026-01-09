using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class ModuloService : IModuloService
	{
		private readonly DbContexto _dbContext;
		public ModuloService(DbContexto dbContext)
		{
			_dbContext = dbContext;
		}

		public bool CompletouModulo(int IdModulo, int IdUser)
		{

			throw new NotImplementedException();
		}

		public async Task<Modulo> CreateModulo(ModuloRequestDTO moduloRequestDTO)
		{
			Modulo Modulo = new Modulo
			{
				Nome = moduloRequestDTO.Nome,
				Descricao = moduloRequestDTO.Descricao,
				CursoId = moduloRequestDTO.CursoId,
				Ordem = moduloRequestDTO.Ordem,
				QuantidadeAulas = moduloRequestDTO.QuantidadeAulas,
				Nivel = moduloRequestDTO.Nivel,
				QuantidadeHoras = moduloRequestDTO.QuantidadeHoras > -1 ? moduloRequestDTO.QuantidadeAulas : 0,
			};
			if (Modulo != null)
			{
				_dbContext.Add(Modulo);
				await _dbContext.SaveChangesAsync();
				return Modulo;
			}
			throw new NullReferenceException();
		}

		public async void DeleteModuloById(Modulo Modulo)
		{
			if (Modulo != null)
			{
				_dbContext.Remove(Modulo);
				await _dbContext.SaveChangesAsync();
				return;
			}
			throw new NullReferenceException();
		}

		public List<Modulo> GetModulosAprovados()
		{
			var res = _dbContext.Modulos.Where(m => m.Status == StatusAprovacao.Aprovado).ToList();
			return res;
		}

		public IEnumerable<Modulo> GetModuloAprovadoByCurseId(int Id)
		{
			IEnumerable<Modulo> res = _dbContext.Modulos.ToList().Where(m => m.CursoId == Id && m.Status == StatusAprovacao.Aprovado);
			return res;
		}

		public Modulo GetModuloById(int IdModulo)
		{
			throw new NotImplementedException();
		}
	}
}
