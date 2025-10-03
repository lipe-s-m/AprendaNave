namespace server.Settings
{
	public class DatabaseSettings
	{

		// 2. PROPRIEDADES: Correspondem às chaves no appsettings.json
		public string Host { get; set; } = string.Empty;
		public int Port { get; set; } = 5432; // PostgreSQL default
		public string Database { get; set; } = string.Empty;
		public string Username { get; set; } = string.Empty;

		// Usamos default! ou string.Empty, pois será preenchido pelo framework.
		public string Password { get; set; } = string.Empty;
	}
}
