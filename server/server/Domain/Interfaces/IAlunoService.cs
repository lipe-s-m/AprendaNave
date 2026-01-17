using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
    public interface IAlunoService
    {
        Aluno? Login(LoginRequestDTO loginRequest);

        Task<CadastroResponseDTO?> CreateAluno(CadastroRequestDTO Aluno);

        List<Aluno> GetAllAlunos(int pagina = 1);
        Aluno? GetById(int id);
        void DeleteById(Aluno Aluno);
        Task<int> AtualizarPontos(int idAluno, int pontos);
        Task<UserResponseDTO> AtualizarAluno(int id, UserUpdateDTO userUpdate);
    }
}
