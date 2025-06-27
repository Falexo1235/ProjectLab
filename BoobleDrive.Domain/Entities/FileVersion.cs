namespace BoobleDrive.Domain.Entities;

public class FileVersion
{
    private FileVersion()
    {
    }

    public FileVersion(Guid fileId, int versionNumber, byte[] content, long size, string hash)
    {
        if (fileId == Guid.Empty)
        {
            throw new ArgumentException("File ID cannot be empty", nameof(fileId));
        }

        if (versionNumber <= 0)
        {
            throw new ArgumentException("Version number must be positive", nameof(versionNumber));
        }

        if (content == null || content.Length == 0)
        {
            throw new ArgumentException("Content cannot be empty", nameof(content));
        }

        if (size <= 0)
        {
            throw new ArgumentException("Size must be positive", nameof(size));
        }

        if (string.IsNullOrWhiteSpace(hash))
        {
            throw new ArgumentException("Hash cannot be empty", nameof(hash));
        }

        Id = Guid.NewGuid();
        FileId = fileId;
        VersionNumber = versionNumber;
        Content = content;
        Size = size;
        Hash = hash;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid FileId { get; private set; }
    public DriveFile File { get; private set; } = null!;
    public int VersionNumber { get; private set; }
    public byte[] Content { get; private set; }
    public long Size { get; private set; }
    public string Hash { get; private set; }
    public DateTime CreatedAt { get; private set; }
}