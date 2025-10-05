namespace server.Domain.Entities
{
	public enum StatusProgressoEnum
	{
		NaoIniciado,
		EmAndamento,
		Concluido
	}
	public class AlunoModuloProgresso
	{

		public int IdAluno { get; set; }
		public int IdModulo { get; set; }

		public Aluno Aluno { get; set; } = default!;
		public Modulo Modulo { get; set; } = default!;
		public StatusProgressoEnum StatusProgresso { get; set; }


	}
}
