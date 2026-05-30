using System.Net;
using System.Text.Json;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;

namespace Sixram.Nextgen.JinmarxWellness.Api.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException exception)
        {
            await WriteResponseAsync(
                context,
                HttpStatusCode.Unauthorized,
                ApiResponse.Unauthorized(exception.Message, traceId: context.TraceIdentifier));
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled API exception.");
            await WriteResponseAsync(
                context,
                HttpStatusCode.InternalServerError,
                ApiResponse.ServerError(traceId: context.TraceIdentifier));
        }
    }

    private static async Task WriteResponseAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        ApiResponse<object> response)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(
            response,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
}
