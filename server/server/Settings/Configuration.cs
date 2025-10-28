namespace server.Settings
{
	public class Configuration
	{
		public string? PrivateKey { get; set; }
		public Configuration(IConfiguration configuration)
		{
			PrivateKey = configuration["PrivateKey"];
		}
	}
}


