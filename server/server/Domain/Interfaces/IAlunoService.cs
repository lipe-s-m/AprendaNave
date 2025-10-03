using server.Domain.DTOs;

namespace server.Domain.Interfaces
{
	public interface IAlunoService
	{
		LoginResponseDTO? Login(LoginRequestDTO loginRequest);
	}
}
