using server.Domain.Interfaces;

namespace server.Endpoints.Aulas
{
	public static class AulasEndpoints
	{
		public static RouteGroupBuilder MapAulasEndpoints(this IEndpointRouteBuilder app)
		{
			var group = app.MapGroup("/aulas").WithTags("Aulas");

			group.MapGet("/{aulaId}", (int aulaId, IAulaService aulaService) =>
			{

				var res = aulaService.GetAulaById(aulaId);
				if (res == null) return Results.Json(data: "aula não encontrada", statusCode: 404);
				return Results.Json(data: res, statusCode: 200);

			});

			return group;
		}
	}
}

