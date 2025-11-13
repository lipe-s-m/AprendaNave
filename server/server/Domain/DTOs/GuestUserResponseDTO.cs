namespace server.Domain.DTOs
{
	public class GuestUserResponseDTO
	{
		public int Id { get; set; }
		public string Nome { get; set; }
		public string Contato { get; set; }
		public GuestUserResponseDTO(int id, string nome, string contato)
		{
			Id = id;
			Nome = nome;
			Contato = contato;
		}

	}
}
