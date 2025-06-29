namespace BoobleDrive.Domain.Entities;

public class PublicLink
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public Guid FileId { get; set; }
    public DriveFile File { get; set; } = null!;
    public string? PasswordHash { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive => !ExpiresAt.HasValue || ExpiresAt.Value > DateTime.UtcNow;
}