using System.ComponentModel.DataAnnotations;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly FileService _fileService;
    private readonly ILogger<PublicController> _logger;

    public PublicController(FileService fileService, ILogger<PublicController> logger)
    {
        _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("{token}")]
    public async Task<ActionResult<FileDto>> GetPublicFile(
        string token,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var file = await _fileService.GetFileByPublicTokenAsync(token, null, cancellationToken);
            if (file == null)
            {
                return NotFound("File not found or link expired");
            }

            return Ok(file);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving public file with token {Token}", token);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{token}/download")]
    public async Task<IActionResult> DownloadPublicFile(
        string token,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var fileInfo = await _fileService.GetFileByPublicTokenAsync(token, null, cancellationToken);
            if (fileInfo == null)
            {
                return NotFound("File not found or link expired");
            }

            var content = await _fileService.DownloadFileByPublicTokenAsync(token, null, cancellationToken);
            if (content == null)
            {
                return NotFound("File content not found");
            }

            return File(content, fileInfo.ContentType, fileInfo.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading public file with token {Token}", token);
            return StatusCode(500, "Internal server error");
        }
    }


} 