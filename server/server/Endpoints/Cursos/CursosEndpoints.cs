using Microsoft.AspNetCore.Mvc;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using System.Security.Claims;

namespace server.Endpoints.Cursos
{
	public static class CursosEndpoints
	{
		public static RouteGroupBuilder MapCursosEndpoints(this IEndpointRouteBuilder app)
		{
			var group = app.MapGroup("/cursos").WithTags("Cursos");

			//obter todos os cursos aprovados
			group.MapGet("/aprovados", (ICursoService cursoService) =>
			{
				var res = cursoService.GetCursosAprovados();
				if (res != null)
				{
					return Results.Ok(res);
				}
				return Results.NotFound(new { message = "Nenhum curso encontrado." });


			});
			group.MapPost("/", ([FromBody] CursoRequestDTO cursoRequestDTO, ICursoService cursoService, ClaimsPrincipal user) =>
		{
			var userIdClaim = user.FindFirst("id")?.Value;
			//verificar id
			if (string.IsNullOrEmpty(userIdClaim)) return Results.Unauthorized();
			if (!int.TryParse(userIdClaim, out int userId))
				return Results.BadRequest("ID de usuário inválido no token.");

			var res = cursoService.CreateCurso(cursoRequestDTO, userId);
			if (res != null)
			{
				return Results.Created($"/cursos/{res.Id}", res);
			}
			return Results.BadRequest(new { message = "Falha ao criar curso." });
		});
			//obter modulos aprovados de um curso
			group.MapGet("/{cursoId}/modulos/aprovados", (int cursoId, IModuloService moduloService) =>
			{
				var res = moduloService.GetModuloAprovadoByCurseId(cursoId);
				if (res != null)
				{
					return Results.Json(res, statusCode: 200);
				}


				return Results.Json(null, statusCode: 500);
			});
			//criar modulo
			group.MapPost("/{cursoId}/modulos", async (int cursoId, [FromBody] ModuloRequestDTO moduloRequestDTO, IModuloService moduloService) =>
			{
				var res = await moduloService.CreateModulo(moduloRequestDTO);
				if (res != null)
				{
					return Results.Created($"/cursos/{cursoId}/modulos/{res.Id}", res);
				}
				return Results.BadRequest(new { message = "Falha ao criar modulo." });
			});
			group.MapGet("/me", async (ClaimsPrincipal user, ICursoService cursoService) =>
			{
				var userIdClaim = user.FindFirst("id")?.Value;
				if (string.IsNullOrEmpty(userIdClaim)) return Results.Unauthorized();

				if (!int.TryParse(userIdClaim, out int userId))
					return Results.BadRequest("ID de usuário inválido no token.");

				var res = await cursoService.getCursosByUserId(userId);
				return Results.Json(res, statusCode: 200);
			});
			return group;
		}
	}

}
