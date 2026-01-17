using Isopoh.Cryptography.Argon2;
using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Exceptions;
using server.Domain.Interfaces;
using server.Repository.Database;

namespace server.Domain.Services
{
    public class AlunoService : IAlunoService
    {
        private readonly DbContexto _context;
        private readonly ILogger<AlunoService> _logger;

        public AlunoService(DbContexto context, ILogger<AlunoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public Aluno? Login(LoginRequestDTO loginRequest)
        {
            var res = _context.Alunos.Where(a => a.Email == loginRequest.Email).FirstOrDefault();

            if (res == null)
            {
                return null;
            }
            //if (res != null)
            if (Argon2.Verify(res.Senha, loginRequest.Senha))
            {
                return res;
            }
            return null;
        }

        public async Task<CadastroResponseDTO?> CreateAluno(CadastroRequestDTO cadastroRequestDTO)
        {
            if (
                cadastroRequestDTO != null
                && cadastroRequestDTO.Senha.Length > 2
                && cadastroRequestDTO.Senha == cadastroRequestDTO.SenhaConfirmacao
            )
            {
                //cadastroRequestDTO.Senha = "senha123";

                cadastroRequestDTO.Senha = Argon2.Hash(cadastroRequestDTO.Senha);
                Aluno aluno;
                aluno = ConvertRequestToAlunoDTO(cadastroRequestDTO);
                if (string.IsNullOrEmpty(aluno.Cargo))
                {
                    aluno.Cargo = "Aluno";
                }
                _context.Alunos.Add(aluno);
                await _context.SaveChangesAsync();
                CadastroResponseDTO cadastroResponseDTO = ConvertAlunoToResponseDTO(aluno);
                return cadastroResponseDTO;
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

            int itensPorPagina = 10;

            var itensList = query.Skip((pagina - 1) * itensPorPagina).Take(itensPorPagina);
            return itensList.ToList();
        }

        public Aluno? GetById(int id)
        {
            var res = _context.Alunos.Where(a => a.Id == id).FirstOrDefault();
            return res;
        }

        public static CadastroResponseDTO ConvertAlunoToResponseDTO(Aluno Aluno)
        {
            if (Aluno != null)
            {
                CadastroResponseDTO AlunoResponseConvertDTO = new CadastroResponseDTO(
                    Aluno.Id,
                    Aluno.Nome,
                    Aluno.Email,
                    Aluno.Cargo
                );
                return AlunoResponseConvertDTO;
            }
            throw new Exception();
        }

        public static Aluno ConvertRequestToAlunoDTO(CadastroRequestDTO CadastroRequestDTO)
        {
            if (CadastroRequestDTO != null)
            {
                Aluno AlunoConvert = new Aluno(
                    CadastroRequestDTO.Nome,
                    CadastroRequestDTO.Email,
                    CadastroRequestDTO.Senha,
                    CadastroRequestDTO.Cargo
                );
                return AlunoConvert;
            }
            throw new Exception();
        }

        public async Task<UserResponseDTO> AtualizarAluno(int id, UserUpdateDTO userUpdate)
        {
            var aluno = await _context.Alunos.FirstOrDefaultAsync(a => a.Id == id);
            if (aluno == null)
            {
                throw new AlunoNaoExisteException($"O usuario de id {id} não existe!");
            }

            aluno.Nome = userUpdate.Nome ?? aluno.Nome;
            aluno.Bio = userUpdate.Bio ?? aluno.Bio;

            await _context.SaveChangesAsync();

            return new UserResponseDTO(aluno);
        }

        public async Task<int> AtualizarPontos(int idAluno, int pontos)
        {
            var aluno = await this._context.Alunos.FirstOrDefaultAsync(a => a.Id == idAluno);
            if (aluno == null)
            {
                throw new AlunoNaoExisteException($"O usuario de id {idAluno} não existe!");
            }

            aluno.Pontos += pontos;
            await _context.SaveChangesAsync();
            return aluno.Pontos;
        }
    }
}
