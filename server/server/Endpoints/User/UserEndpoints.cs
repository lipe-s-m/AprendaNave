using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using server.Domain.DTOs;
using server.Domain.Interfaces;

namespace server.Endpoints.User
{
	public static class UserEndpoints
	{
		public static RouteGroupBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
		{
			var group = app.MapGroup("user").WithTags("User");

			//pegar o id do user logado
			group.MapGet("/", (ICurrentUser currentUser) =>
			{
				return currentUser.Id;
			});

			//criar
			group.MapPost("/", async ([FromBody] CadastroRequestDTO aluno, IAlunoService alunoService) =>
			{
				var novoAluno = await alunoService.CreateAluno(aluno);
				if (novoAluno != null)
				{
					return Results.Created($"/alunos/{novoAluno.Id}", novoAluno);
				}
				return Results.BadRequest("Falha na criação do aluno (ex: senha muito curta).");
			});

			//listar todos
			group.MapGet("/list", (IAlunoService alunoService) =>
			{
				var res = alunoService.GetAllAlunos();
				if (res != null)
				{
					return Results.Json(data: res, statusCode: 200);
				}
				return Results.Json(data: null, statusCode: 500);
			});

			//todo atualizar
			group.MapPatch("/", async (UserUpdateDTO userUpdate, IAlunoService alunoService, ICurrentUser currentUser) =>
			{
				var res = await alunoService.AtualizarAluno(currentUser.Id, userUpdate);
				return Results.Ok(res);

			}).RequireAuthorization();
			group.MapPatch("/image", async (IFormFile file, IImageService imageService, ICurrentUser currentUser) =>
			{
				int id = currentUser.Id;
				var result = await imageService.AddImageAsync(file, "users/profilePic", $"user_{id}");

				if (result.Error != null) return Results.BadRequest(result.Error.Message);
				var res = await imageService.UpdateProfileImage(id, result);
				return Results.Ok(res);

			}).DisableAntiforgery(); ;

			//todo deletar
			group.MapDelete("/{id}", async (int id) =>
			{

			});


			group.MapPatch("/{idUsuario}/pontos", async (int idUsuario, [FromBody] PontosDTO pontos, IAlunoService alunoService) =>
			{
				return "ainda vou fazer isso sksksk";

			});

			return group;
		}
	}
}
