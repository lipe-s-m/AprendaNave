using DotNetEnv;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Domain.Services;
using server.Repository.Database;

Env.Load();
var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");


builder.Services.AddScoped<IAlunoService, AlunoService>();
builder.Services.AddDbContext<DbContexto>(options =>
{
	options.UseNpgsql(connectionString);
});


var app = builder.Build();
app.MapGet("/", () => "Hello World!");
app.MapPost("/login", ([FromBody] LoginRequestDTO loginRequestDTO, IAlunoService alunoService) =>
{
	if (alunoService.Login(loginRequestDTO) != null)
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


