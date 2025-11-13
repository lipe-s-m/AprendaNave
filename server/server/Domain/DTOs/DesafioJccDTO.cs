namespace server.Domain.DTOs
{
	public class DesafioJccDTO
	{
		public int IdAluno { get; set; }
		public string NomeAluno { get; set; }
		public int PontuacaoAluno { get; set; }
		public DesafioJccDTO(int idAluno, string nomeAluno, int pontuacaoAluno)
		{
			IdAluno = idAluno;
			NomeAluno = nomeAluno;
			PontuacaoAluno = pontuacaoAluno;
		}

	}
}
