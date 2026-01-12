using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Domain.Services;
using server.Endpoints.Aulas;
using server.Endpoints.Cursos;
using server.Endpoints.Modulos;
using server.Endpoints.User;
using server.Repository.Database;
using server.Settings;
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
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAlunoService, AlunoService>();
builder.Services.AddScoped<ICursoService, CursoService>();
builder.Services.AddScoped<IModuloService, ModuloService>();
builder.Services.AddScoped<IDesafioJcc, DesafioJccService>();
builder.Services.AddScoped<IRanking, RankingService>();
builder.Services.AddScoped<IGuestUser, GuestUserService>();
builder.Services.AddScoped<IAulaService, AulaService>();
builder.Services.AddScoped<ICurrentUser, CurrentUserService>();
builder.Services.AddDbContext<DbContexto>(options =>
	//options.UseNpgsql(builder.Configuration.GetConnectionString("Host=localhost;Port=5432;Database=aprendanavedb;User Id=postgres;"),
	//options.UseNpgsql(builder.Configuration.GetConnectionString("LocalConnection"),
	options.UseNpgsql(builder.Configuration.GetConnectionString("LocalDockerConnection"),
	//options.UseNpgsql(builder.Configuration.GetConnectionString("TransationConnection"),
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
if (app.Environment.IsDevelopment())
{
	app.UseDeveloperExceptionPage();
}
else
{
	app.UseExceptionHandler(appBuilder =>
	{
		appBuilder.Run(async context =>
		{
			context.Response.StatusCode = 500;
			await context.Response.WriteAsJsonAsync(new
			{
				error = "Erro interno no servidor"
			});
		});
	});
}
app.UseCors("CorsPolicy");
app.UseCors("CorsPolicyProd");
app.UseAuthentication();
app.UseAuthorization();


app.MapGet("/", () => "Hello World!");
app.MapPost("/auth/login", ([FromBody] LoginRequestDTO loginRequestDTO, IAlunoService alunoService, TokenService tokenService, HttpContext httpContext) =>
{
	var res = alunoService.Login(loginRequestDTO);
	if (res == null)
	{
		return Results.Json(data: "Email ou Senha incorretos!", statusCode: 401);
	}
	if (res != null)
	{
		LoginResponseDTO LoginDto = new LoginResponseDTO
		{
			Nome = res.Nome,
			Email = res.Email,
			Cargo = res.Cargo,
			Pontos = res.Pontos
		};
		var tokenJwt = tokenService.Generate(res);

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

})
	.WithTags("Auth");

app.MapUserEndpoints();
app.MapCursosEndpoints();
app.MapModulosEndpoints();
app.MapAulasEndpoints();

app.MapPost("/guests", async ([FromBody] GuestUserRequestDTO guestUserRequestDTO, [FromServices] IGuestUser guestUserService) =>
{
	try
	{
		var res = await guestUserService.CreateGuestUser(guestUserRequestDTO);
		return Results.Json(data: res, statusCode: 201);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 400);
	}
}).WithTags("Visitantes");
app.MapGet("/guests", async ([FromServices] IGuestUser guestUserService) =>
{
	try
	{
		var res = await guestUserService.GetAllGuestUsers();
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
}).WithTags("Visitantes");
app.MapGet("/desafio/desafio-jcc/ranking", async ([FromServices] IDesafioJcc desafioJccService) =>
{
	try
	{
		var res = await desafioJccService.ObterRankingDesafioJcc();
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
}).WithTags("DesafioJCC");
app.MapGet("desafio/desafio-jcc/desafiantes", async ([FromServices] IDesafioJcc desafioJccService) =>
{
	try
	{
		var res = await desafioJccService.ObterTodosAlunosComPontuacao();
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
}).WithTags("DesafioJCC");
app.MapPatch("/desafio/desafio-jcc/pontuacao", async ([FromBody] DesafioJccDTO desafioJccDTO, [FromServices] IDesafioJcc desafioJccService) =>
{
	try
	{
		var res = await desafioJccService.AtualizarPontuacaoAluno(desafioJccDTO.IdAluno, desafioJccDTO.NomeAluno, desafioJccDTO.PontuacaoAluno);
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 400);
	}
}).WithTags("DesafioJCC");

app.MapGet("/rankings/modalidade/ranking", async ([FromQuery] string modalidade, [FromServices] IRanking rankingService) =>
{
	try
	{
		var res = await rankingService.ObterRankingPorModalidade(modalidade);
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
}).WithTags("Ranking");
app.MapGet("/rankings/desafiantes", async ([FromQuery] string modalidade, [FromServices] IRanking rankingService) =>
{
	try
	{
		var res = await rankingService.ObterTodosAlunosComPontuacao(modalidade);
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 500);
	}
}).WithTags("Ranking");
app.MapPatch("/rankings/pontuacao", async ([FromBody] RankingDTO rankingDTO, [FromServices] IRanking rankingService) =>
{
	try
	{
		var res = await rankingService.AtualizarPontuacaoAluno(rankingDTO.IdAluno, rankingDTO.NomeAluno, rankingDTO.PontuacaoAluno, rankingDTO.Modalidade);
		return Results.Json(data: res, statusCode: 200);
	}
	catch (Exception ex)
	{
		return Results.Json(data: ex, statusCode: 400);
	}
}).WithTags("Ranking");

app.MapGet("/auth/validate-token", (
	TokenService TokenService, HttpContext httpContext
	) =>
{
	if (httpContext.User.Identity?.IsAuthenticated == true)
	{
		return Results.Ok(); // 200 OK
	}
	return Results.Unauthorized(); // 401 Unauthorized
}).WithTags("Auth");
app.UseSwagger();
app.UseSwaggerUI(options =>
{
	options.SwaggerEndpoint("/swagger/v1/swagger.json", "API AprendaNave");
	options.RoutePrefix = "swagger";
});

app.Run();




