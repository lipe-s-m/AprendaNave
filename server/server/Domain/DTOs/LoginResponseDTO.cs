using server.Domain.Entities;

namespace server.Domain.DTOs
{
    public class LoginResponseDTO
    {
        public string Nome { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Cargo { get; set; } = default!;
        public int Pontos { get; set; } = 0;
        public string? Bio { get; set; }
        public string? FotoPerfil { get; set; }

        public LoginResponseDTO(Aluno aluno)
        {
            Nome = aluno.Nome;
            Email = aluno.Email;
            Cargo = aluno.Cargo;
            Pontos = aluno.Pontos;
            Bio = aluno.Bio;
            FotoPerfil = aluno.FotoPerfil;
        }
    }
}
