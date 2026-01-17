using Microsoft.AspNetCore.Mvc;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Domain.Services;

namespace server.Endpoints.Auth
{
    public static class AuthEndpoints
    {
        public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/auth").WithTags("Auth");

            app.MapPost(
                    "/auth/login",
                    (
                        [FromBody] LoginRequestDTO loginRequestDTO,
                        IAlunoService alunoService,
                        TokenService tokenService,
                        HttpContext httpContext
                    ) =>
                    {
                        var res = alunoService.Login(loginRequestDTO);
                        if (res == null)
                        {
                            return Results.Json(
                                data: "Email ou Senha incorretos!",
                                statusCode: 401
                            );
                        }
                        if (res != null)
                        {
                            LoginResponseDTO LoginDto = new LoginResponseDTO(res);
                            var tokenJwt = tokenService.Generate(res);

                            var cookieOptions = new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.None,
                                Expires = DateTimeOffset.UtcNow.AddHours(2),
                            };
                            httpContext.Response.Cookies.Append(
                                "access_token",
                                tokenJwt,
                                cookieOptions
                            );
                            return Results.Json(data: LoginDto, statusCode: 200);
                        }

                        return Results.Json(data: "Email ou Senha incorretos!", statusCode: 401);
                    }
                )
                .WithTags("Auth");

            return group;
        }
    }
}
