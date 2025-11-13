using server.Domain.DTOs;

namespace server.Domain.Interfaces
{
	public interface IGuestUser
	{
		Task<GuestUserResponseDTO?> CreateGuestUser(GuestUserRequestDTO guestUserRequestDTO);
		Task<IEnumerable<GuestUserResponseDTO?>> GetAllGuestUsers();
	}
}
