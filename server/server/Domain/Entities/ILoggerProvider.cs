namespace server.Domain.Entities
{
	public interface ILoggerProvider : IDisposable
	{
		ILogger CreateLogger(string categoryName);
	}
}
