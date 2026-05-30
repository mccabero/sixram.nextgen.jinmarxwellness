using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Models;

namespace Sixram.Nextgen.JinmarxWellness.Api.Controllers;

[Route("api/health")]
public class HealthController : ApiControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<object>> Get()
    {
        return Success<object>(new
        {
            status = "ok",
            service = "sixram.nextgen.jinmarx-wellness"
        });
    }
}
