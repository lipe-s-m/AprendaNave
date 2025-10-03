var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();


app.MapGet("/", () => "Hello World!");
app.MapPost("/login", (LoginRequestDTO loginRequestDTO) =>
{
	if (loginRequestDTO.Email != null && loginRequestDTO.Senha != null)
	{
		return Results.Ok("Usuario Logado com Sucesso!");
	}

	return Results.Unauthorized();

});

app.MapPost("/cadastro", (CadastroRequestDTO cadastroRequestDTO) =>
{
	if (cadastroRequestDTO.Nome != null && cadastroRequestDTO.Senha != null)
	{
		return Results.Ok("Usuario criado com sucesso");
	}
	return Results.BadRequest("Erro! Campos inválidos!");
});

app.Run();





//classes
class LoginRequestDTO
{
	public string Email { get; set; }
	public string Senha { get; set; }
}

class CadastroRequestDTO
{
	public string Nome { get; set; }
	public string Email { get; set; }
	public string Senha { get; set; }
	public string SenhaConfirmacao { get; set; }
}