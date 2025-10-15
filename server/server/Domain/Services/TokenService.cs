using System.IdentityModel.Tokens.Jwt;

namespace server.Domain.Services
{
	public class TokenService
	{
		public string Generate(AlunoService AlunoService)
		{
			var handler = new JwtSecurityTokenHandler();
			return "ddd";
		}

	}
}
