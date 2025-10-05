namespace server.Domain.Interfaces
{
	public interface IAuditableEntity
	{
		public DateTime CreatedAt { get; set; }
		public DateTime? LastUpdatedAt { get; set; }
	}
}
