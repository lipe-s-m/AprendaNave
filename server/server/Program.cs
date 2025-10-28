using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Domain.Services;
using server.Repository.Database;
using server.Settings;
using System.Security.Claims;
using System.Text;

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
builder.Services.AddCors(options =>
{
	options.AddPolicy("CorsPolicyProd",
		  builder => builder
				.WithOrigins("https://aprendanave.vercel.app/")

				.AllowAnyMethod()

				.AllowAnyHeader()
				.AllowCredentials()
	 );
});
builder.Services.AddScoped<IAlunoService, AlunoService>();
builder.Services.AddScoped<ICursoService, CursoService>();
builder.Services.AddScoped<IModuloService, ModuloService>();
builder.Services.AddDbContext<DbContexto>(options =>
	//options.UseNpgsql(builder.Configuration.GetConnectionString("Host=localhost;Port=5432;Database=aprendanavedb;User Id=postgres;"),
	//options.UseNpgsql(builder.Configuration.GetConnectionString("LocalConnection"),
	options.UseNpgsql(builder.Configuration.GetConnectionString("TransationConnection"),
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
builder.Services.AddSingleton<Configuration, Configuration>();
builder.Services.AddTransient<TokenService>();
builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
	options.Events = new JwtBearerEvents
	{
		OnMessageReceived = context =>
		{
			// Tenta ler o token do Cookie
			if (context.Request.Cookies.ContainsKey("access_token"))
			{
				context.Token = context.Request.Cookies["access_token"];
			}
			return Task.CompletedTask;
		}
	};
	options.TokenValidationParameters = new TokenValidationParameters
	{
		ValidateIssuerSigningKey = true,
		IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["PrivateKey"])), // Sua chave secreta

		// Opcional, mas recomendado:
		ValidateIssuer = false,
		//ValidIssuer = builder.Configuration["JwtSettings:Issuer"], // O "iss" no seu token
		ValidateAudience = false,
		//ValidAudience = builder.Configuration["JwtSettings:Audience"], // O "aud" no seu token

		ValidateLifetime = true,
		ClockSkew = TimeSpan.Zero,
	};
});
builder.Services.AddAuthorization();


var app = builder.Build();
app.UseCors("CorsPolicy");
app.UseCors("CorsPolicyProd");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");
app.MapGet("/ola", () => "ola World!");
app.MapPost("/auth/login", ([FromBody] LoginRequestDTO loginRequestDTO, IAlunoService alunoService, TokenService tokenService, HttpContext httpContext) =>
{
	var res = alunoService.Login(loginRequestDTO);
	if (res != null)
	{
		LoginResponseDTO LoginDto = new LoginResponseDTO
		{
			Id = res.Id,
			Nome = res.Nome,
			Email = res.Email,
			Cargo = res.Cargo
		};
		var tokenJwt = tokenService.Generate(LoginDto);

		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true,
			SameSite = SameSiteMode.None,
			Expires = DateTimeOffset.UtcNow.AddHours(2)
		};
		httpContext.Response.Cookies.Append("access_token", tokenJwt, cookieOptions);
		return Results.Json(data: LoginDto, statusCode: 200);
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
			return Results.Ok(res);
		}
		return Results.NotFound(new { message = "Nenhum curso encontrado." });
	}
	catch (Exception ex)
	{
		return Results.Problem(
						detail: ex.Message, // Em produção, você pode querer logar isso e não enviar.
						statusCode: 500,
						title: "Ocorreu um erro interno no servidor."
				  );
	}
});
app.MapGet("/cursos/modulos", (
	[FromQuery] int? cursoId,
	IModuloService moduloService
	) =>
{
	if (cursoId != null)
	{
		try
		{
			var res = moduloService.GetModulosByCurseId(cursoId);

			if (res != null)
			{
				return Results.Json(res, statusCode: 200);
			}
		}
		catch (Exception ex)
		{
			var error = new ErrorResponse(400, ex.Message);
			return Results.Json(error, statusCode: 400);
		}
	}
	//se nao for filtrar por curso
	try
	{

		var res = moduloService.GetAllModulos();
		if (res != null)
		{
			return Results.Json(res, statusCode: 200);
		}

	}
	catch (Exception ex)
	{
		var error = new ErrorResponse(400, ex.Message);
		return Results.Json(error, statusCode: 400);
	}
	return Results.Json(null, statusCode: 500);
})
	//.RequireAuthorization()
	;

app.MapGet("/modulos", (int IdModulo, IModuloService ModuloService, ClaimsPrincipal user) =>
{
	try
	{
		var IdUser = user.FindFirst("id")?.Value;
		if (string.IsNullOrEmpty(IdUser))
		{
			return Results.Forbid();
		}
		bool compleat = ModuloService.CompletouModulo(IdModulo, int.Parse(IdUser));
		var res = ModuloService.GetAllModulos();
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
})
	//.RequireAuthorization()
	;

//app.MapGet("/auth/generate-token", (
//	TokenService TokenService, LoginResponseDTO loginResponseDTO
//	) =>
//{
//	return TokenService.Generate(loginResponseDTO);
//});

app.MapGet("/auth/validate-token", (
	TokenService TokenService, HttpContext httpContext
	) =>
{
	if (httpContext.User.Identity?.IsAuthenticated == true)
	{
		return Results.Ok(); // 200 OK
	}
	return Results.Unauthorized(); // 401 Unauthorized
});
app.UseSwagger();
app.UseSwaggerUI(options =>
{
	options.SwaggerEndpoint("/swagger/v1/swagger.json", "API AprendaNave");
	options.RoutePrefix = "swagger";
});

app.Run();




