using server.Domain.DTOs;
using server.Domain.Entities;
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
			var res = _context.Alunos.Where(a => a.Email == loginRequest.Email && a.Senha == loginRequest.Senha).FirstOrDefault();
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
		public CadastroResponseDTO? Cadastro(CadastroRequestDTO cadastroRequest)
		{
			throw new NotImplementedException();
		}

		public async Task<Aluno?> CreateAluno(Aluno aluno)
		{
			if (aluno != null && aluno.Senha.Length > 2)
			{
				_context.Alunos.Add(aluno);
				await _context.SaveChangesAsync();
				return aluno;
			}
			return null;
		}

		public void DeleteById(Aluno aluno)
		{
			_context.Alunos.Remove(aluno);
			_context.SaveChanges();

		}

		public List<Aluno> GetAllAlunos(int pagina = 1)
		{
			var query = _context.Alunos.AsQueryable();

			int itensPorPagina = 6;

			var itensList = query.Skip((pagina - 1) * itensPorPagina).Take(itensPorPagina);
			return itensList.ToList();
		}

		public Aluno? GetById(int id)
		{
			var res = _context.Alunos.Where(a => a.Id == id).FirstOrDefault();
			return res;
		}


	}
}
