using Microsoft.AspNetCore.Mvc;
using server.Domain.DTOs;
using server.Domain.Interfaces;

namespace server.Endpoints.Modulos
{
	public static class ModulosEndpoints
	{
		public static RouteGroupBuilder MapModulosEndpoints(this IEndpointRouteBuilder app)
		{
			var group = app.MapGroup("/modulos").WithTags("Módulos");

			group.MapGet("/aprovados", (IModuloService moduloService) =>
			{
				var res = moduloService.GetModulosAprovados();
				if (res == null) return Results.Json(data: "Nenhum módulo encontrado.", statusCode: 404);
				return Results.Json(data: res, statusCode: 200);
			});

			group.MapGet("/{moduloId}/aulas/aprovadas", (int moduloId, IAulaService aulaService) =>
			{
				var res = aulaService.GetAllAulasAprovadasByModuloId(moduloId);
				if (res == null) return Results.Json(data: "Módulo não encontrado ou sem aulas.", statusCode: 404);

				return Results.Json(data: res, statusCode: 200);
			});
			group.MapPost("/{moduloId}/aulas", async ([FromBody] AulaRequestDTO aulaRequest, int moduloId, IAulaService aulaService) =>
			{
				if (moduloId == aulaRequest.IdModulo)
				{
					var res = await aulaService.CreateAula(aulaRequest);
					if (res == null) return Results.Json(data: "Erro ao criar aula.", statusCode: 404);
					return Results.Json(data: res, statusCode: 200);
				}
				return Results.Json(data: "IDs incompativeis.", statusCode: 404);
			});
			return group;
		}
	}

}
