using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class ModuloService : IModuloService
	{
		private readonly DbContexto _dbContext;

		public async Task<Modulo> CreateModulo(Modulo Modulo)
		{
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

		public List<Modulo> GetAllModulos()
		{
			var res = _dbContext.Modulos.ToList();
			return res;
		}

		public Modulo GetModuloById(int Id)
		{
			throw new NotImplementedException();
		}
	}
}
