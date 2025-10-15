using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IModuloService
	{
		List<Modulo> GetAllModulos();
		Task<Modulo> CreateModulo(Modulo Modulo);
		Modulo GetModuloById(int Id);
		void DeleteModuloById(Modulo Modulo);


	}
}
