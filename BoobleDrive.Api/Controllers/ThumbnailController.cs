using BoobleDrive.Application.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ThumbnailController : ControllerBase
{
    private readonly FileService _fileService;
    private readonly ILogger<ThumbnailController> _logger;

    public ThumbnailController(FileService fileService, ILogger<ThumbnailController> logger)
    {
        _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("{fileId:guid}")]
    public async Task<IActionResult> GetThumbnail(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        try
        {
            var thumbnailContent = await _fileService.GetThumbnailAsync(fileId, userId, cancellationToken);
            if (thumbnailContent == null)
            {
                return NotFound("Thumbnail not available");
            }

            return File(thumbnailContent, "image/jpeg");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting thumbnail for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("public/{token}")]
    public async Task<IActionResult> GetPublicThumbnail(
        string token,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var thumbnailContent = await _fileService.GetThumbnailByPublicTokenAsync(token, null, cancellationToken);
            if (thumbnailContent == null)
            {
                return NotFound("Thumbnail not available");
            }

            return File(thumbnailContent, "image/jpeg");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public thumbnail with token {Token}", token);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null;
    }
} 