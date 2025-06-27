using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using BoobleDrive.Domain.ValueObjects;

namespace BoobleDrive.Domain.Entities;

public class User
{
    private readonly List<DriveFile> _files = new List<DriveFile>();
    private readonly List<RefreshToken> _refreshTokens = new List<RefreshToken>();

    private User()
    {
    }

    public User(Email email, string hashedPassword, string firstName, string lastName)
    {
        Id = Guid.NewGuid();
        Email = email ?? throw new ArgumentNullException(nameof(email));
        HashedPassword = hashedPassword ?? throw new ArgumentNullException(nameof(hashedPassword));
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        CreatedAt = DateTime.UtcNow;
        LastLoginAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Email Email { get; private set; }
    public string HashedPassword { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public long TotalStorageUsed { get; private set; }
    public long StorageQuota { get; } = 5_000_000_000;
    public DateTime CreatedAt { get; private set; }
    public DateTime LastLoginAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    public IReadOnlyList<DriveFile> Files => _files.AsReadOnly();
    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        IsActive = true;
    }

    public void AddFile(DriveFile file)
    {
        if (file == null)
        {
            throw new ArgumentNullException(nameof(file));
        }

        if (TotalStorageUsed + file.Size > StorageQuota)
        {
            throw new InvalidOperationException("Storage quota exceeded");
        }

        _files.Add(file);
        TotalStorageUsed += file.Size;
    }

    public void RemoveFile(DriveFile file)
    {
        if (file == null)
        {
            throw new ArgumentNullException(nameof(file));
        }

        if (_files.Remove(file))
        {
            TotalStorageUsed -= file.Size;
        }
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void AddRefreshToken(RefreshToken token)
    {
        if (token == null)
        {
            throw new ArgumentNullException(nameof(token));
        }

        _refreshTokens.Add(token);
    }

    public void RemoveRefreshToken(string token)
    {
        var rt = _refreshTokens.FirstOrDefault(t => t.Token == token);
        if (rt != null)
        {
            _refreshTokens.Remove(rt);
        }
    }
}