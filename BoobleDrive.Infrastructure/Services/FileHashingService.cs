using System.Security.Cryptography;
using BoobleDrive.Domain.Services;

namespace BoobleDrive.Infrastructure.Services;

public class FileHashingService : IFileHashingService
{
    public string ComputeHash(byte[] content)
    {
        if (content == null || content.Length == 0)
        {
            throw new ArgumentException("Content cannot be null or empty", nameof(content));
        }

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(content);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public string ComputeHash(Stream stream)
    {
        if (stream == null)
        {
            throw new ArgumentNullException(nameof(stream));
        }

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(stream);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public bool VerifyHash(byte[] content, string expectedHash)
    {
        if (content == null || content.Length == 0)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(expectedHash))
        {
            return false;
        }

        try
        {
            var actualHash = ComputeHash(content);
            return string.Equals(actualHash, expectedHash, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}