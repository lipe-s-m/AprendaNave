using Microsoft.IdentityModel.Tokens;
using server.Domain.Entities;
using server.Settings;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace server.Domain.Services
{
	public class TokenService
	{
		private readonly Configuration _config;
		public TokenService(Configuration config)
		{
			_config = config;
		}
		public string Generate(Aluno User)
		{
			var handler = new JwtSecurityTokenHandler();
			var key = Encoding.UTF8.GetBytes(_config.PrivateKey);
			var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature);
			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = GenerateClaims(User),
				SigningCredentials = credentials,
				Expires = DateTime.UtcNow.AddHours(2)
			};
			var token = handler.CreateToken(tokenDescriptor);
			var strToken = handler.WriteToken(token);
			return strToken;
		}

		public static ClaimsIdentity GenerateClaims(Aluno User)
		{
			var ci = new ClaimsIdentity();
			ci.AddClaim(new Claim("id", User.Id.ToString()));
			ci.AddClaim(new Claim(ClaimTypes.Name, User.Nome));
			ci.AddClaim(new Claim(ClaimTypes.Email, User.Email));
			ci.AddClaim(new Claim("cargo", User.Cargo));
			return ci;
		}
	}
}
