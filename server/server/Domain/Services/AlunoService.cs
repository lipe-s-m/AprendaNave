using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
	public class AlunoService : IAlunoService
	{
		private readonly DbContexto _context;

		public AlunoService(DbContexto context)
		{
			_context = context;
		}

		public LoginResponseDTO? Login(LoginRequestDTO loginRequest)
		{
			var res = _context.Aluno.Where(a => a.Email == loginRequest.Email && a.Senha == loginRequest.Senha).FirstOrDefault();
			if (res != null)
			{
				return new LoginResponseDTO
				{
					Id = res.Id,
					Nome = res.Nome,
					Email = res.Email,
				};
			}
			return null;
		}
	}
}
