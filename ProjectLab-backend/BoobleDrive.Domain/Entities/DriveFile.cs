using BoobleDrive.Domain.Enums;
using BoobleDrive.Domain.ValueObjects;

namespace BoobleDrive.Domain.Entities;

public class DriveFile
{
    private readonly List<PublicLink> _publicLinks = new List<PublicLink>();
    private readonly List<FileShare> _shares = new List<FileShare>();
    private readonly List<DriveFileTag> _tags = new List<DriveFileTag>();
    private readonly List<FileVersion> _versions = new List<FileVersion>();
    private readonly List<Guid> _favoritedBy = new List<Guid>();

    private DriveFile()
    {
    }

    public DriveFile(string name, MimeType contentType, long size, string hash, Guid ownerId, byte[] content, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("File name cannot be empty", nameof(name));
        }

        if (size <= 0)
        {
            throw new ArgumentException("File size must be positive", nameof(size));
        }

        if (string.IsNullOrWhiteSpace(hash))
        {
            throw new ArgumentException("File hash cannot be empty", nameof(hash));
        }

        if (ownerId == Guid.Empty)
        {
            throw new ArgumentException("Owner ID cannot be empty", nameof(ownerId));
        }

        Id = Guid.NewGuid();
        Name = name;
        Description = description;
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
        Size = size;
        Hash = hash;
        OwnerId = ownerId;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;

        var initialVersion = new FileVersion(Id, 1, content, size, hash);
        _versions.Add(initialVersion);
    }

    public Guid Id { get; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public MimeType ContentType { get; private set; }
    public long Size { get; private set; }
    public string Hash { get; private set; }
    public Guid OwnerId { get; private set; }
    public User Owner { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }
    public FileVisibility Visibility { get; private set; } = FileVisibility.Private;
    public bool IsDeleted => DeletedAt.HasValue;
    public FileVersion CurrentVersion => _versions.OrderByDescending(v => v.VersionNumber).First();

    public IReadOnlyList<FileVersion> Versions => _versions.AsReadOnly();
    public IReadOnlyList<FileShare> Shares => _shares.AsReadOnly();
    public IReadOnlyList<DriveFileTag> Tags => _tags.AsReadOnly();
    public IReadOnlyList<PublicLink> PublicLinks => _publicLinks.AsReadOnly();
    public IReadOnlyList<Guid> FavoritedBy => _favoritedBy.AsReadOnly();

    public void UpdateMetadata(string? name = null, string? description = null)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            Name = name;
        }

        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddTag(Tag tag)
    {
        if (_tags.Any(t => t.TagId == tag.Id))
        {
            return;
        }

        _tags.Add(new DriveFileTag(Id, tag.Id));
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveTag(Guid tagId)
    {
        var tagToRemove = _tags.FirstOrDefault(t => t.TagId == tagId);
        if (tagToRemove != null)
        {
            _tags.Remove(tagToRemove);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddToFavorites(Guid userId)
    {
        if (!_favoritedBy.Contains(userId))
        {
            _favoritedBy.Add(userId);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RemoveFromFavorites(Guid userId)
    {
        if (_favoritedBy.Remove(userId))
        {
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public bool IsFavoritedBy(Guid userId)
    {
        return _favoritedBy.Contains(userId);
    }

    public void AddVersion(byte[] content, long size, string hash)
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("Cannot add version to deleted file");
        }

        var versionNumber = _versions.Count + 1;
        var newVersion = new FileVersion(Id, versionNumber, content, size, hash);
        _versions.Add(newVersion);

        Size = size;
        Hash = hash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ShareWith(User user, FilePermission permission)
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("Cannot share deleted file");
        }

        if (user.Id == OwnerId)
        {
            throw new InvalidOperationException("Cannot share file with owner");
        }

        var existingShare = _shares.FirstOrDefault(s => s.UserId == user.Id);
        if (existingShare != null)
        {
            existingShare.UpdatePermission(permission);
        }
        else
        {
            var share = new FileShare(Id, user.Id, permission);
            _shares.Add(share);
        }
    }

    public void RevokeShare(Guid userId)
    {
        var share = _shares.FirstOrDefault(s => s.UserId == userId);
        if (share != null)
        {
            _shares.Remove(share);
        }
    }

    public void SetVisibility(FileVisibility visibility)
    {
        Visibility = visibility;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        DeletedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool CanAccess(Guid userId, FilePermission requiredPermission)
    {
        if (IsDeleted)
        {
            return false;
        }

        if (userId == OwnerId)
        {
            return true;
        }

        
        if (requiredPermission == FilePermission.Read)
        {
            return true;
        }

        var share = _shares.FirstOrDefault(s => s.UserId == userId);
        return share?.Permission >= requiredPermission;
    }

    public void TransferOwnership(Guid newOwnerId)
    {
        if (newOwnerId == Guid.Empty)
        {
            throw new ArgumentException("New owner id cannot be empty", nameof(newOwnerId));
        }

        OwnerId = newOwnerId;
        
        _shares.Clear();
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddPublicLink(PublicLink link)
    {
        if (link == null)
        {
            throw new ArgumentNullException(nameof(link));
        }

        _publicLinks.Add(link);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemovePublicLink(PublicLink link)
    {
        if (link == null)
        {
            return;
        }

        _publicLinks.Remove(link);
        UpdatedAt = DateTime.UtcNow;
    }
}