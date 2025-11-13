namespace server.Domain.DTOs
{
	public class GuestUserRequestDTO
	{
		public string Nome { get; set; }
		public string Contato { get; set; }
		public GuestUserRequestDTO(string nome, string contato)
		{
			Nome = nome;
			Contato = contato;
		}
	}
}
