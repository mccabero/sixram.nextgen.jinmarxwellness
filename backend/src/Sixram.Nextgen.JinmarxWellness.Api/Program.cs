using System.Text.Json.Serialization;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using Sixram.Nextgen.JinmarxWellness.Api.Middleware;
using Sixram.Nextgen.JinmarxWellness.Application.Auth.Validators;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;
using Sixram.Nextgen.JinmarxWellness.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

var localFrontendOrigins =
    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"];

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .SelectMany(x => x.Value?.Errors ?? [])
            .Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? "Validation error." : x.ErrorMessage)
            .Distinct()
            .ToArray();

        return new BadRequestObjectResult(ApiResponse.ValidationError(errors, context.HttpContext.TraceIdentifier));
    };
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalFrontend", policy =>
    {
        policy.WithOrigins(localFrontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "sixram.nextgen.jinmarx-wellness API",
        Version = "v1",
        Description = "Jinmarx Wellness POS baseline API."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter a JWT bearer token. Example: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "openapi";
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "sixram.nextgen.jinmarx-wellness API v1");
});

app.UseCors("LocalFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (builder.Configuration.GetValue<bool>("DatabaseStartup:ApplyMigrationsOnStartup"))
{
    await app.Services.ApplyDatabaseMigrationsAsync();
}

if (builder.Configuration.GetValue<bool>("DatabaseStartup:RunSeederOnStartup"))
{
    await app.Services.SeedDatabaseAsync();
}

app.Run();

public partial class Program;
