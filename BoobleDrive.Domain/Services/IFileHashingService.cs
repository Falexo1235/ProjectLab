namespace BoobleDrive.Domain.Services;

public interface IFileHashingService
{
    string ComputeHash(byte[] content);
    string ComputeHash(Stream stream);
    bool VerifyHash(byte[] content, string expectedHash);
}