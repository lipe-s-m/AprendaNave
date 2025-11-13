namespace server.Domain.Exceptions
{
	public class AlunoNaoExisteException : Exception
	{
		public AlunoNaoExisteException() { }
		public AlunoNaoExisteException(string message) : base(message) { }
	}

}