using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult<ApiResponse<T>> Success<T>(T data, string? message = null)
    {
        return Ok(ApiResponse.Success(data, message, HttpContext.TraceIdentifier));
    }

    protected ActionResult<ApiResponse<object>> SuccessMessage(string message)
    {
        return Ok(ApiResponse.Success<object>(null, message, HttpContext.TraceIdentifier));
    }
}
