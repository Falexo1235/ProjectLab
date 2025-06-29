using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Application.Services;
using BoobleDrive.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly FileService _fileService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(FileService fileService, ILogger<FilesController> logger)
    {
        _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FileDto>>> SearchFiles(
        [FromQuery] string? searchTerm = null,
        [FromQuery] List<string>? tags = null,
        [FromQuery] FileType fileType = FileType.All,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var files = await _fileService.SearchFilesAsync(searchTerm, userId.Value, tags, fileType, cancellationToken);
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching files for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{fileId:guid}")]
    public async Task<ActionResult<FileDto>> GetFile(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        try
        {
            var file = await _fileService.GetFileByIdAsync(fileId, userId, cancellationToken);

            if (file == null)
            {
                return NotFound("File not found");
            }

            return Ok(file);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{fileId:guid}/download")]
    public async Task<IActionResult> DownloadFile(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        try
        {
            var fileInfo = await _fileService.GetFileByIdAsync(fileId, userId, cancellationToken);
            if (fileInfo == null)
            {
                return NotFound("File not found");
            }

            var content = await _fileService.DownloadFileAsync(fileId, userId ?? Guid.Empty, cancellationToken);
            if (content == null)
            {
                return NotFound("File content not found");
            }

            return File(content, fileInfo.ContentType, fileInfo.Name);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("upload")]
    public async Task<ActionResult<FileDto>> UploadFile(
        [FromForm] FileUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest("No file provided");
            }

            using var memoryStream = new MemoryStream();
            await request.File.CopyToAsync(memoryStream, cancellationToken);
            var content = memoryStream.ToArray();

            var fileName = !string.IsNullOrWhiteSpace(request.Name) ? request.Name : request.File.FileName;
            var contentType = request.File.ContentType;

            var file = await _fileService.UploadFileAsync(
                fileName,
                request.Description,
                contentType,
                content,
                ownerId.Value,
                cancellationToken);

            return CreatedAtAction(nameof(GetFile), new { fileId = file.Id }, file);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid file upload operation");
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid file upload arguments");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{fileId:guid}")]
    public async Task<ActionResult<FileDto>> UpdateFile(
        Guid fileId,
        [FromBody] FileUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var file = await _fileService.UpdateFileMetadataAsync(
                fileId,
                userId.Value,
                request.Name,
                request.Description,
                cancellationToken);

            if (file == null)
            {
                return NotFound("File not found");
            }

            return Ok(file);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{fileId:guid}")]
    public async Task<IActionResult> DeleteFile(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var deleted = await _fileService.DeleteFileAsync(fileId, userId.Value, cancellationToken);

            if (!deleted)
            {
                return NotFound("File not found");
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{fileId:guid}/share")]
    public async Task<IActionResult> ShareFile(
        Guid fileId,
        [FromBody] ShareFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.ShareFileAsync(
                fileId,
                ownerId.Value,
                request.TargetUserId,
                request.Permission,
                request.ExpiresAt,
                cancellationToken);

            return Ok("File shared successfully");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sharing file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{fileId:guid}/share/{targetUserId:guid}")]
    public async Task<IActionResult> RevokeFileShare(
        Guid fileId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.RevokeFileShareAsync(fileId, ownerId.Value, targetUserId, cancellationToken);
            return Ok("File share revoked successfully");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking file share for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{fileId:guid}/visibility")]
    public async Task<IActionResult> SetFileVisibility(
        Guid fileId,
        [FromBody] SetVisibilityRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.SetFileVisibilityAsync(fileId, userId.Value, request.Visibility, cancellationToken);
            return Ok("File visibility updated successfully");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting file visibility for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{fileId:guid}/transfer-ownership")]
    public async Task<IActionResult> TransferOwnership(
        Guid fileId,
        [FromBody] TransferOwnershipRequest request,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.TransferOwnershipAsync(fileId, ownerId.Value, request.NewOwnerId, cancellationToken);
            return Ok("Ownership transferred successfully.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transferring ownership for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{fileId:guid}/share-link")]
    public async Task<ActionResult<PublicLinkDto>> CreateShareLink(
        Guid fileId,
        [FromBody] CreateShareLinkRequest request,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var publicLink = await _fileService.CreatePublicLinkAsync(fileId, ownerId.Value, request.Password, request.ExpiresAt, cancellationToken);
            return Ok(publicLink);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating share link for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{fileId:guid}/share-link")]
    public async Task<IActionResult> DeleteShareLink(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var ownerId = GetUserId();
        if (!ownerId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.DeletePublicLinkAsync(fileId, ownerId.Value, cancellationToken);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting share link for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }



    [HttpPut("{fileId:guid}/tags")]
    public async Task<IActionResult> UpdateTags(
        Guid fileId,
        [FromBody] UpdateTagsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.UpdateTagsAsync(fileId, userId.Value, request.Tags, cancellationToken);
            return Ok("Tags updated successfully.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tags for file {FileId}", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{fileId:guid}/favorite")]
    public async Task<IActionResult> AddToFavorites(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.AddToFavoritesAsync(fileId, userId.Value, cancellationToken);
            return Ok("File added to favorites.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding file {FileId} to favorites", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{fileId:guid}/favorite")]
    public async Task<IActionResult> RemoveFromFavorites(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _fileService.RemoveFromFavoritesAsync(fileId, userId.Value, cancellationToken);
            return Ok("File removed from favorites.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Access denied");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing file {FileId} from favorites", fileId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<IReadOnlyList<FileDto>>> GetFavoriteFiles(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var files = await _fileService.GetFavoriteFilesAsync(userId.Value, cancellationToken);
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving favorite files for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null;
    }
}

public class FileUploadRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }

    [Required] public IFormFile File { get; set; } = null!;
}

public class FileUpdateRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class ShareFileRequest
{
    [Required] public Guid TargetUserId { get; set; }

    [Required] public FilePermission Permission { get; set; }

    public DateTime? ExpiresAt { get; set; }
}

public class SetVisibilityRequest
{
    [Required] public FileVisibility Visibility { get; set; }
}

public class TransferOwnershipRequest
{
    [Required] public Guid NewOwnerId { get; set; }
}

public class CreateShareLinkRequest
{
    public string? Password { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class UpdateTagsRequest
{
    public List<string> Tags { get; set; } = new List<string>();
}