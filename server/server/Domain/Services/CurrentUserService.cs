using server.Domain.Interfaces;

namespace server.Domain.Services
{
	public class CurrentUserService : ICurrentUser
	{
		public int Id { get; }

		public CurrentUserService(IHttpContextAccessor accessor)
		{
			var userId = accessor.HttpContext?.User.FindFirst("id")?.Value;
			if (userId == null) throw new UnauthorizedAccessException();

			Id = int.Parse(userId);
		}
	}
}
