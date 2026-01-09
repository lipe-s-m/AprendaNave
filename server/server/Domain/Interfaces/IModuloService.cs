using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IModuloService
	{
		List<Modulo> GetModulosAprovados();
		Task<Modulo> CreateModulo(ModuloRequestDTO ModuloRequestDTO);
		Modulo GetModuloById(int IdModulo);
		IEnumerable<Modulo> GetModuloAprovadoByCurseId(int IdModulo);
		void DeleteModuloById(Modulo Modulo);
		bool CompletouModulo(int idModulo, int IdUser);

	}
}
