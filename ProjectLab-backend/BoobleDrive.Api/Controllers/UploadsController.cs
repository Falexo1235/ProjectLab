using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BoobleDrive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UploadsController : ControllerBase
{
    private readonly ILogger<UploadsController> _logger;
    private readonly UploadService _uploadService;

    public UploadsController(UploadService uploadService, ILogger<UploadsController> logger)
    {
        _uploadService = uploadService;
        _logger = logger;
    }

    [HttpPost("initiate")]
    public async Task<ActionResult<string>> InitiateUpload(
        [FromBody] InitiateUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var uploadId = await _uploadService.InitiateUploadAsync(
                request.FileName,
                request.ContentType,
                request.FileSize,
                userId.Value,
                cancellationToken);
            return Ok(uploadId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating file upload");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{uploadId}")]
    public async Task<IActionResult> UploadChunk(
        string uploadId,
        [FromQuery] int chunkNumber,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file chunk provided.");
        }

        try
        {
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, cancellationToken);
            var chunkData = memoryStream.ToArray();

            await _uploadService.UploadChunkAsync(uploadId, chunkNumber, chunkData, userId.Value, cancellationToken);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading chunk for upload {UploadId}", uploadId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{uploadId}/complete")]
    public async Task<IActionResult> CompleteUpload(
        string uploadId,
        [FromBody] CompleteUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var fileDto = await _uploadService.CompleteUploadAsync(uploadId, request.FileHash, userId.Value, cancellationToken);
            return Ok(fileDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing upload for {UploadId}", uploadId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null;
    }
}

public class InitiateUploadRequest
{
    [Required] public string FileName { get; set; }

    [Required] public string ContentType { get; set; }

    [Required] public long FileSize { get; set; }
}

public class CompleteUploadRequest
{
    public string? FileHash { get; set; }
}