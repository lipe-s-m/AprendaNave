namespace server.Configurations
{
	public class PasswordHashOptions
	{
		public int MemoryKb { get; set; }
		public int TimeCost { get; set; }
		public int Lanes { get; set; }
		public int Threads { get; set; }
		public int HashLength { get; set; }
	}
}
