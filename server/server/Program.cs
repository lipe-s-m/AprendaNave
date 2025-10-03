var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.Run();

app.MapGet("/", () => "Hello World!");


