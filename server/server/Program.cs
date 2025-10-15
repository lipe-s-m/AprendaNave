using DotNetEnv;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Domain.Services;
using server.Repository.Database;

Env.Load();
var builder = WebApplication.CreateBuilder(args);
//var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
//Environment.GetEnvironmentVariable("DefaultConnection") ??
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
builder.Services.AddScoped<ICursoService, CursoService>();
builder.Services.AddScoped<IModuloService, ModuloService>();
builder.Services.AddDbContext<DbContexto>(options =>
	options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
	npgsqlOptions => npgsqlOptions.EnableRetryOnFailure())
	.EnableSensitiveDataLogging()
	.EnableDetailedErrors()
	.EnableSensitiveDataLogging()
	.EnableDetailedErrors()
	.UseSnakeCaseNamingConvention()
);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
	{
		Version = "v1",
		Title = "API AprendaNave"
	});
});



var app = builder.Build();
app.UseCors("CorsPolicy");

app.MapGet("/", () => "Hello World!");
app.MapGet("/ola", () => "ola World!");
app.MapPost("/auth/login", ([FromBody] LoginRequestDTO loginRequestDTO, IAlunoService alunoService) =>
{
	if (alunoService.Login(loginRequestDTO) != null)
	{
		return Results.Ok("Usuario Logado com Sucesso!");
	}

	return Results.Json(data: "Email ou Senha incorretos!", statusCode: 401);

});

app.MapPost("/users", async ([FromBody] CadastroRequestDTO aluno, IAlunoService alunoService) =>
{
	var novoAluno = await alunoService.CreateAluno(aluno);
	if (novoAluno != null)
	{
		return Results.Created($"/alunos/{novoAluno.Id}", novoAluno);
	}
	return Results.BadRequest("Falha na criação do aluno (ex: senha muito curta).");
});

app.MapGet("/users", (IAlunoService alunoService) =>
{
	var res = alunoService.GetAllAlunos();
	if (res != null)
	{
		return Results.Json(data: res, statusCode: 200);
	}
	return Results.Json(data: null, statusCode: 500);
});
app.MapGet("/cursos", (ICursoService cursoService) =>
{
	try
	{
		var res = cursoService.GetAllCursos();
		if (res != null)
		{
			return Results.Json(data: res, statusCode: 200);
		}
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
	return Results.Json(data: null, statusCode: 500);
});
app.MapGet("/modulos", (IModuloService ModuloService) =>
{
	try
	{
		var res = ModuloService.GetAllModulos();
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
});

app.UseSwagger();
app.UseSwaggerUI(options =>
{
	options.SwaggerEndpoint("/swagger/v1/swagger.json", "API AprendaNave");
	options.RoutePrefix = "swagger";
});

app.Run();



