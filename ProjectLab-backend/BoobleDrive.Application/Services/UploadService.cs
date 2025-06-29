using System.Collections.Concurrent;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Domain.Entities;
using BoobleDrive.Domain.Repositories;
using BoobleDrive.Domain.Services;
using BoobleDrive.Domain.ValueObjects;

namespace BoobleDrive.Application.Services;

public class UploadService
{
    private static readonly ConcurrentDictionary<string, UploadSession> _sessions = new ConcurrentDictionary<string, UploadSession>();
    private readonly IFileHashingService _fileHashingService;

    private readonly IFileRepository _fileRepository;
    private readonly IUserRepository _userRepository;

    public UploadService(IFileRepository fileRepository, IUserRepository userRepository, IFileHashingService fileHashingService)
    {
        _fileRepository = fileRepository;
        _userRepository = userRepository;
        _fileHashingService = fileHashingService;
    }

    public Task<string> InitiateUploadAsync(string fileName, string contentType, long fileSize, Guid userId, CancellationToken cancellationToken)
    {
        var uploadId = Guid.NewGuid().ToString("N");
        var tempDirectory = Path.Combine(Path.GetTempPath(), "BoobleDriveUploads", uploadId);
        Directory.CreateDirectory(tempDirectory);

        var session = new UploadSession
        {
            UploadId = uploadId,
            FileName = fileName,
            ContentType = contentType,
            FileSize = fileSize,
            UserId = userId,
            TempDirectory = tempDirectory,
            StartedAt = DateTime.UtcNow
        };

        _sessions[uploadId] = session;

        return Task.FromResult(uploadId);
    }

    public async Task UploadChunkAsync(string uploadId, int chunkNumber, byte[] chunkData, Guid userId, CancellationToken cancellationToken)
    {
        if (!_sessions.TryGetValue(uploadId, out var session) || session.UserId != userId)
        {
            throw new InvalidOperationException("Invalid upload session.");
        }

        var chunkPath = Path.Combine(session.TempDirectory, $"{chunkNumber}.chunk");
        await File.WriteAllBytesAsync(chunkPath, chunkData, cancellationToken);

        session.UploadedChunks.Add(chunkNumber);
    }

    public async Task<FileDto> CompleteUploadAsync(string uploadId, string? fileHash, Guid userId, CancellationToken cancellationToken)
    {
        if (!_sessions.TryRemove(uploadId, out var session) || session.UserId != userId)
        {
            throw new InvalidOperationException("Invalid upload session.");
        }

        var combinedFilePath = Path.Combine(Path.GetTempPath(), session.FileName);

        try
        {
            await using (var combinedFileStream = new FileStream(combinedFilePath, FileMode.Create))
            {
                foreach (var chunkNumber in session.UploadedChunks.OrderBy(c => c))
                {
                    var chunkPath = Path.Combine(session.TempDirectory, $"{chunkNumber}.chunk");
                    var chunkBytes = await File.ReadAllBytesAsync(chunkPath, cancellationToken);
                    await combinedFileStream.WriteAsync(chunkBytes, cancellationToken);
                }
            }

            var fileBytes = await File.ReadAllBytesAsync(combinedFilePath, cancellationToken);
            var computedHash = _fileHashingService.ComputeHash(fileBytes);

            if (fileHash != null && !computedHash.Equals(fileHash, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("File integrity check failed. Hashes do not match.");
            }


            var owner = await _userRepository.GetByIdAsync(userId, cancellationToken)
                ?? throw new ArgumentException("User not found");

            var file = new DriveFile(session.FileName, new MimeType(session.ContentType), fileBytes.Length, computedHash, userId, fileBytes);
            owner.AddFile(file);

            await _fileRepository.AddAsync(file, cancellationToken);
            await _userRepository.UpdateAsync(owner, cancellationToken);

            return new FileDto { Id = file.Id, Name = file.Name, Size = file.Size };
        }
        finally
        {
            if (File.Exists(combinedFilePath))
            {
                File.Delete(combinedFilePath);
            }

            if (Directory.Exists(session.TempDirectory))
            {
                Directory.Delete(session.TempDirectory, true);
            }
        }
    }
}

internal class UploadSession
{
    public string UploadId { get; set; }
    public string FileName { get; set; }
    public string ContentType { get; set; }
    public long FileSize { get; set; }
    public Guid UserId { get; set; }
    public string TempDirectory { get; set; }
    public DateTime StartedAt { get; set; }
    public ConcurrentBag<int> UploadedChunks { get; } = new ConcurrentBag<int>();
}