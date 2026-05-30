namespace Sixram.Nextgen.JinmarxWellness.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];
    public string? TraceId { get; init; }
}

public static class ApiResponse
{
    public static ApiResponse<T> Success<T>(
        T? data,
        string? message = "Request completed successfully.",
        string? traceId = null) =>
        new()
        {
            Success = true,
            Message = message,
            Data = data,
            TraceId = traceId
        };

    public static ApiResponse<T> Error<T>(
        string message,
        IEnumerable<string>? errors = null,
        string? traceId = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = errors?.Distinct().ToArray() ?? [],
            TraceId = traceId
        };

    public static ApiResponse<object> ValidationError(
        IEnumerable<string>? errors = null,
        string? traceId = null,
        string? message = "Validation failed.") =>
        Error<object>(message ?? "Validation failed.", errors, traceId);

    public static ApiResponse<object> Unauthorized(
        string message = "Authentication is required.",
        IEnumerable<string>? errors = null,
        string? traceId = null) =>
        Error<object>(message, errors, traceId);

    public static ApiResponse<object> ServerError(
        string message = "An unexpected error occurred.",
        IEnumerable<string>? errors = null,
        string? traceId = null) =>
        Error<object>(message, errors, traceId);
}
