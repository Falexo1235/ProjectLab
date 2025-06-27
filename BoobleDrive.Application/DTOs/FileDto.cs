namespace BoobleDrive.Application.DTOs;

public class FileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Hash { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Visibility { get; set; } = string.Empty;
    public int VersionCount { get; set; }
    public List<string> Tags { get; set; } = new List<string>();
    public bool IsFavorite { get; set; }
}