using BoobleDrive.Domain.Enums;

namespace BoobleDrive.Domain.Entities;

public class FileShare
{
    private FileShare()
    {
    }

    public FileShare(Guid fileId, Guid userId, FilePermission permission, DateTime? expiresAt = null)
    {
        if (fileId == Guid.Empty)
        {
            throw new ArgumentException("File ID cannot be empty", nameof(fileId));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty", nameof(userId));
        }

        Id = Guid.NewGuid();
        FileId = fileId;
        UserId = userId;
        Permission = permission;
        ExpiresAt = expiresAt;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid FileId { get; private set; }
    public DriveFile File { get; private set; } = null!;
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public FilePermission Permission { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public bool IsExpired => ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;

    public void UpdatePermission(FilePermission permission)
    {
        Permission = permission;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetExpiration(DateTime? expiresAt)
    {
        ExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }
}