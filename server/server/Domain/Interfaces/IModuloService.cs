using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IModuloService
	{
		List<Modulo> GetAllModulos();
		Task<Modulo> CreateModulo(Modulo Modulo);
		Modulo GetModuloById(int IdModulo);
		IEnumerable<Modulo> GetModulosByCurseId(int? IdModulo);
		void DeleteModuloById(Modulo Modulo);
		bool CompletouModulo(int idModulo, int IdUser);

	}
}
