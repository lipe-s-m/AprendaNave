using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IAlunoService
	{
		LoginResponseDTO? Login(LoginRequestDTO loginRequest);

		CadastroResponseDTO? Cadastro(CadastroRequestDTO cadastroRequest);
		Task<Aluno?> CreateAluno(Aluno aluno);

		List<Aluno> GetAllAlunos(int pagina = 1);
		Aluno? GetById(int id);
		void DeleteById(Aluno aluno);
	}
}
