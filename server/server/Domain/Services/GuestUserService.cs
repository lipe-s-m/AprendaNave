using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class GuestUserService : IGuestUser
	{
		private readonly DbContexto _context;

		public GuestUserService(DbContexto context)
		{
			_context = context;
		}
		public async Task<GuestUserResponseDTO?> CreateGuestUser(GuestUserRequestDTO guestUserRequestDTO)
		{
			try
			{
				var res = await _context.GuestUsers.FirstOrDefaultAsync(g => g.Nome == guestUserRequestDTO.Nome);

				res = new GuestUser
				(
					 guestUserRequestDTO.Nome,
					 guestUserRequestDTO.Contato
				);
				_context.GuestUsers.Add(res);
				await _context.SaveChangesAsync();

				return new GuestUserResponseDTO(res.Id, res.Nome, res.Contato);

			}
			catch (Exception ex)
			{
				throw new Exception($"Erro ao criar usuário convidado: {ex.Message}");
			}

		}

		public Task<IEnumerable<GuestUserResponseDTO?>> GetAllGuestUsers()
		{
			var res = _context.GuestUsers
				.Select(g => (GuestUserResponseDTO?)new GuestUserResponseDTO(g.Id, g.Nome, g.Contato))
				.AsEnumerable();
			return Task.FromResult(res);
		}
	}
}
