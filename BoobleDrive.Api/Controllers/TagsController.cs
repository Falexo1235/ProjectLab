using System.Security.Claims;
using BoobleDrive.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly ITagRepository _tagRepository;
    private readonly ILogger<TagsController> _logger;

    public TagsController(ITagRepository tagRepository, ILogger<TagsController> logger)
    {
        _tagRepository = tagRepository ?? throw new ArgumentNullException(nameof(tagRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<string>>> GetAllTags(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tags = await _tagRepository.GetAllTagsAsync(cancellationToken);
            var tagNames = tags.Select(t => t.Name).ToList();
            return Ok(tagNames);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all tags");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<string>>> SearchTags(
        [FromQuery] string? q,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tags = await _tagRepository.SearchTagsAsync(q ?? string.Empty, limit, cancellationToken);
            var tagNames = tags.Select(t => t.Name).ToList();
            return Ok(tagNames);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching tags with query {Query}", q);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null;
    }
} 