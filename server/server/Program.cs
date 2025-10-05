using DotNetEnv;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Entities;
using server.Domain.Interfaces;
using server.Domain.Services;
using server.Repository.Database;

Env.Load();
var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddCors(options =>
{
	options.AddPolicy("CorsPolicy",
		  builder => builder
				.WithOrigins("http://localhost:4200")

				.AllowAnyMethod()

				.AllowAnyHeader()
				.AllowCredentials()
	 );
});
builder.Services.AddScoped<IAlunoService, AlunoService>();
builder.Services.AddDbContext<DbContexto>(options =>
{
	options.UseNpgsql(connectionString);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
	{
		Version = "v1", // Define a versão da sua API (ex: v1, v2)
		Title = "API AprendaNave"
	});
});



var app = builder.Build();
app.UseCors("CorsPolicy");

app.MapGet("/", () => "Hello World!");
app.MapPost("/login", ([FromBody] LoginRequestDTO loginRequestDTO, IAlunoService alunoService) =>
{
	if (alunoService.Login(loginRequestDTO) != null)
	{
		return Results.Ok("Usuario Logado com Sucesso!");
	}

	return Results.Json(data: "Email ou Senha incorretos!", statusCode: 401);

});

app.MapPost("/cadastro", (CadastroRequestDTO cadastroRequestDTO) =>
{
	if (cadastroRequestDTO.Nome != null && cadastroRequestDTO.Senha != null)
	{
		return Results.Ok("Usuario criado com sucesso");
	}
	return Results.BadRequest("Erro! Campos inválidos!");
});

app.MapPost("/alunos", async ([FromBody] Aluno aluno, IAlunoService alunoService) =>
{
	var novoAluno = await alunoService.CreateAluno(aluno);
	if (novoAluno != null)
	{
		return Results.Created($"/alunos/{novoAluno.Id}", novoAluno);
	}
	return Results.BadRequest("Falha na validação do aluno (ex: senha muito curta).");
});



app.UseSwagger();
app.UseSwaggerUI(options =>
{
	// Aponta o Swagger UI para o documento "v1" que você definiu acima
	options.SwaggerEndpoint("/swagger/v1/swagger.json", "API AprendaNave");
	// Garante que a página inicial do Swagger não tente carregar o JSON de um local padrão incorreto:
	options.RoutePrefix = "swagger"; // Acessível em /swagger
});

app.Run();



