using System.Security.Cryptography;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Domain.Entities;
using BoobleDrive.Domain.Enums;
using BoobleDrive.Domain.Repositories;
using BoobleDrive.Domain.Services;
using BoobleDrive.Domain.ValueObjects;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using FFMpegCore;
using FFMpegCore.Enums;

namespace BoobleDrive.Application.Services;

public class FileService
{
    private readonly IFileHashingService _fileHashingService;
    private readonly IFileRepository _fileRepository;
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly ITagRepository _tagRepository;
    private readonly IUserRepository _userRepository;

    public FileService(
        IFileRepository fileRepository,
        IUserRepository userRepository,
        IFileHashingService fileHashingService,
        IPasswordHashingService passwordHashingService,
        ITagRepository tagRepository)
    {
        _fileRepository = fileRepository ?? throw new ArgumentNullException(nameof(fileRepository));
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _fileHashingService = fileHashingService ?? throw new ArgumentNullException(nameof(fileHashingService));
        _passwordHashingService = passwordHashingService ?? throw new ArgumentNullException(nameof(passwordHashingService));
        _tagRepository = tagRepository ?? throw new ArgumentNullException(nameof(tagRepository));
    }

    public async Task<FileDto?> GetFileByIdAsync(Guid fileId, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdWithTagsAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            return null;
        }

        if (file.Visibility != FileVisibility.Public && !file.CanAccess(userId ?? Guid.Empty, FilePermission.Read))
        {
            return null;
        }

        return MapToDto(file, userId);
    }

    public async Task<IReadOnlyList<FileDto>> GetUserFilesAsync(Guid userId, List<string>? tags, CancellationToken cancellationToken = default)
    {
        var files = await _fileRepository.GetByOwnerIdAsync(userId, false, tags, cancellationToken);
        return files.Select(f => MapToDto(f, userId)).ToList();
    }

    public async Task<IReadOnlyList<FileDto>> GetSharedFilesAsync(Guid userId, List<string>? tags, CancellationToken cancellationToken = default)
    {
        var files = await _fileRepository.GetSharedWithUserAsync(userId, tags, cancellationToken);
        return files.Select(f => MapToDto(f, userId)).ToList();
    }

    public async Task<IReadOnlyList<FileDto>> SearchFilesAsync(string? searchTerm, Guid userId, List<string>? tags, FileType fileType, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<DriveFile> files;

        switch (fileType)
        {
            case FileType.Own:
                files = await _fileRepository.GetByOwnerIdAsync(userId, false, tags, cancellationToken);
                break;
            case FileType.Shared:
                files = await _fileRepository.GetSharedWithUserAsync(userId, tags, cancellationToken);
                break;
            case FileType.Favorites:
                files = await _fileRepository.GetFavoritesByUserIdAsync(userId, cancellationToken);
                if (tags != null && tags.Any())
                {
                    var loweredTags = tags.Select(t => t.ToLower()).ToList();
                    files = files.Where(f => loweredTags.All(tag => f.Tags.Any(t => t.Tag.Name.ToLower() == tag))).ToList();
                }
                break;
            case FileType.All:
            default:
                var ownedFiles = await _fileRepository.GetByOwnerIdAsync(userId, false, tags, cancellationToken);
                var sharedFiles = await _fileRepository.GetSharedWithUserAsync(userId, tags, cancellationToken);
                files = ownedFiles.Concat(sharedFiles).DistinctBy(f => f.Id).ToList();
                break;
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowered = searchTerm.ToLower();
            files = files.Where(f => 
                f.Name.ToLower().Contains(lowered) || 
                (f.Description != null && f.Description.ToLower().Contains(lowered))
            ).ToList();
        }

        return files.Select(f => MapToDto(f, userId)).OrderByDescending(f => f.UpdatedAt).ToList();
    }

    public async Task<FileDto> UploadFileAsync(string fileName, string? description, string contentType, byte[] content, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var mimeType = new MimeType(contentType);

        var owner = await _userRepository.GetByIdAsync(ownerId, cancellationToken);
        if (owner == null)
        {
            throw new ArgumentException("User not found", nameof(ownerId));
        }

        if (owner.TotalStorageUsed + content.Length > owner.StorageQuota)
        {
            throw new InvalidOperationException("Storage quota exceeded");
        }

        var fileHash = _fileHashingService.ComputeHash(content);

        var existingFile = await _fileRepository.ExistsByHashAsync(fileHash, cancellationToken);
        if (existingFile)
        {
        }

        var file = new DriveFile(fileName, mimeType, content.Length, fileHash, ownerId, content, description);

        owner.AddFile(file);

        await _fileRepository.AddAsync(file, cancellationToken);
        await _userRepository.UpdateAsync(owner, cancellationToken);

        return MapToDto(file, ownerId);
    }

    public async Task<byte[]?> DownloadFileAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdWithVersionsAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            return null;
        }

        if (file.Visibility != FileVisibility.Public && !file.CanAccess(userId, FilePermission.Read))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        return file.CurrentVersion.Content;
    }

    public async Task<FileDto?> UpdateFileMetadataAsync(Guid fileId, Guid userId, string? name = null, string? description = null, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            return null;
        }

        if (!file.CanAccess(userId, FilePermission.Write))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        file.UpdateMetadata(name, description);
        await _fileRepository.UpdateAsync(file, cancellationToken);

        return MapToDto(file, userId);
    }

    public async Task<bool> DeleteFileAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdWithTagsAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            return false;
        }

        if (!file.CanAccess(userId, FilePermission.Delete))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        var owner = await _userRepository.GetByIdAsync(file.OwnerId, cancellationToken);
        if (owner != null)
        {
            owner.RemoveFile(file);
            await _userRepository.UpdateAsync(owner, cancellationToken);
        }

        file.SoftDelete();
        await _fileRepository.UpdateAsync(file, cancellationToken);

        return true;
    }

    public async Task ShareFileAsync(Guid fileId, Guid ownerId, Guid targetUserId, FilePermission permission, DateTime? expiresAt = null, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            throw new ArgumentException("File not found");
        }

        if (!file.CanAccess(ownerId, FilePermission.Share))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        var targetUser = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (targetUser == null)
        {
            throw new ArgumentException("Target user not found");
        }

        file.ShareWith(targetUser, permission);


        var share = file.Shares.First(s => s.UserId == targetUserId);
        if (expiresAt.HasValue)
        {
            share.SetExpiration(expiresAt);
        }

        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task RevokeFileShareAsync(Guid fileId, Guid ownerId, Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            throw new ArgumentException("File not found");
        }

        if (!file.CanAccess(ownerId, FilePermission.Share))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        file.RevokeShare(targetUserId);
        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task SetFileVisibilityAsync(Guid fileId, Guid userId, FileVisibility visibility, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);

        if (file == null || file.IsDeleted)
        {
            throw new ArgumentException("File not found");
        }

        if (!file.CanAccess(userId, FilePermission.Share))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        file.SetVisibility(visibility);
        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task TransferOwnershipAsync(Guid fileId, Guid ownerId, Guid newOwnerId, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);
        if (file == null || file.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        var newOwner = await _userRepository.GetByIdAsync(newOwnerId, cancellationToken);
        if (newOwner == null)
        {
            throw new ArgumentException("New owner not found.", nameof(newOwnerId));
        }

        var oldOwner = await _userRepository.GetByIdAsync(ownerId, cancellationToken);

        file.TransferOwnership(newOwnerId);

        if (oldOwner != null)
        {
            oldOwner.RemoveFile(file);
            await _userRepository.UpdateAsync(oldOwner, cancellationToken);
        }

        newOwner.AddFile(file);
        await _userRepository.UpdateAsync(newOwner, cancellationToken);

        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task<PublicLinkDto> CreatePublicLinkAsync(Guid fileId, Guid ownerId, string? password, DateTime? expiresAt, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdAsync(fileId, cancellationToken);
        if (file == null || file.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var link = new PublicLink
        {
            FileId = fileId,
            Token = token,
            ExpiresAt = expiresAt,
            PasswordHash = password != null ? _passwordHashingService.HashPassword(password) : null
        };

        file.AddPublicLink(link);
        await _fileRepository.UpdateAsync(file, cancellationToken);

        return new PublicLinkDto { Url = $"/p/{token}" };
    }

    public async Task DeletePublicLinkAsync(Guid fileId, Guid ownerId, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdWithPublicLinksAsync(fileId, cancellationToken);
        if (file == null || file.OwnerId != ownerId)
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        var link = file.PublicLinks.FirstOrDefault();
        if (link != null)
        {
            file.RemovePublicLink(link);
            await _fileRepository.UpdateAsync(file, cancellationToken);
        }
    }

    public async Task<byte[]?> GetThumbnailAsync(Guid fileId, Guid? userId, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdWithVersionsAsync(fileId, cancellationToken);
        if (file == null || file.IsDeleted)
        {
            return null;
        }

        
        
        
        
        

        if (file.ContentType.IsImage)
        {
            var content = file.CurrentVersion.Content;
            if (content == null)
            {
                return null;
            }

            using var image = Image.Load(content);
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(100, 100),
                Mode = ResizeMode.Crop
            }));

            using var ms = new MemoryStream();
            await image.SaveAsJpegAsync(ms, cancellationToken);
            return ms.ToArray();
        }
        else if (file.ContentType.IsVideo)
        {
            var content = file.CurrentVersion.Content;
            if (content == null)
            {
                return null;
            }

            var tempVideoPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.{file.ContentType.SubType}");
            var tempThumbnailPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.jpg");

            try
            {
                await File.WriteAllBytesAsync(tempVideoPath, content, cancellationToken);

                await FFMpegArguments
                    .FromFileInput(tempVideoPath)
                    .OutputToFile(tempThumbnailPath, true, options => options
                        .Seek(TimeSpan.FromSeconds(1))
                        .WithVideoFilters(filterOptions => filterOptions.Scale(100, 100))
                        .WithFrameOutputCount(1))
                    .ProcessAsynchronously();

                if (File.Exists(tempThumbnailPath))
                {
                    return await File.ReadAllBytesAsync(tempThumbnailPath, cancellationToken);
                }
            }
            catch (Exception)
            {
                return null;
            }
            finally
            {
                if (File.Exists(tempVideoPath))
                    File.Delete(tempVideoPath);
                if (File.Exists(tempThumbnailPath))
                    File.Delete(tempThumbnailPath);
            }
        }

        return null;
    }



    public async Task UpdateTagsAsync(Guid fileId, Guid userId, List<string> tagNames, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdWithTagsAsync(fileId, cancellationToken);
        if (file == null || !file.CanAccess(userId, FilePermission.Write))
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        var tags = await _tagRepository.GetOrCreateTagsAsync(tagNames, cancellationToken);

        foreach (var existing in file.Tags.Select(t => t.TagId).ToList())
        {
            file.RemoveTag(existing);
        }

        foreach (var tag in tags)
        {
            file.AddTag(tag);
        }

        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task AddToFavoritesAsync(Guid fileId, Guid userId, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdWithTagsAsync(fileId, cancellationToken);
        if (file == null || !file.CanAccess(userId, FilePermission.Read))
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        file.AddToFavorites(userId);
        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task RemoveFromFavoritesAsync(Guid fileId, Guid userId, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByIdWithTagsAsync(fileId, cancellationToken);
        if (file == null || !file.CanAccess(userId, FilePermission.Read))
        {
            throw new UnauthorizedAccessException("Access denied or file not found.");
        }

        file.RemoveFromFavorites(userId);
        await _fileRepository.UpdateAsync(file, cancellationToken);
    }

    public async Task<IReadOnlyList<FileDto>> GetFavoriteFilesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var files = await _fileRepository.GetFavoritesByUserIdAsync(userId, cancellationToken);
        return files.Select(f => MapToDto(f, userId)).ToList();
    }

    public async Task<FileDto?> GetFileByPublicTokenAsync(string token, string? password, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByPublicTokenAsync(token, cancellationToken);
        if (file == null)
        {
            return null;
        }

        var publicLink = file.PublicLinks.FirstOrDefault(pl => pl.Token == token && pl.IsActive);
        if (publicLink == null)
        {
            return null;
        }

        return MapToDto(file);
    }

    public async Task<byte[]?> DownloadFileByPublicTokenAsync(string token, string? password, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByPublicTokenAsync(token, cancellationToken);
        if (file == null)
        {
            return null;
        }

        var publicLink = file.PublicLinks.FirstOrDefault(pl => pl.Token == token && pl.IsActive);
        if (publicLink == null)
        {
            return null;
        }

        return file.CurrentVersion.Content;
    }

    public async Task<byte[]?> GetThumbnailByPublicTokenAsync(string token, string? password, CancellationToken cancellationToken)
    {
        var file = await _fileRepository.GetByPublicTokenAsync(token, cancellationToken);
        if (file == null)
        {
            return null;
        }

        var publicLink = file.PublicLinks.FirstOrDefault(pl => pl.Token == token && pl.IsActive);
        if (publicLink == null)
        {
            return null;
        }

        if (file.ContentType.IsImage)
        {
            var content = file.CurrentVersion.Content;
            if (content == null)
            {
                return null;
            }

            using var image = Image.Load(content);
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(100, 100),
                Mode = ResizeMode.Crop
            }));

            using var ms = new MemoryStream();
            await image.SaveAsJpegAsync(ms, cancellationToken);
            return ms.ToArray();
        }
        else if (file.ContentType.IsVideo)
        {
            var content = file.CurrentVersion.Content;
            if (content == null)
            {
                return null;
            }

            var tempVideoPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.{file.ContentType.SubType}");
            var tempThumbnailPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.jpg");

            try
            {
                await File.WriteAllBytesAsync(tempVideoPath, content, cancellationToken);

                await FFMpegArguments
                    .FromFileInput(tempVideoPath)
                    .OutputToFile(tempThumbnailPath, true, options => options
                        .Seek(TimeSpan.FromSeconds(1))
                        .WithVideoFilters(filterOptions => filterOptions.Scale(100, 100))
                        .WithFrameOutputCount(1))
                    .ProcessAsynchronously();

                if (File.Exists(tempThumbnailPath))
                {
                    return await File.ReadAllBytesAsync(tempThumbnailPath, cancellationToken);
                }
            }
            catch (Exception)
            {
                return null;
            }
            finally
            {
                if (File.Exists(tempVideoPath))
                    File.Delete(tempVideoPath);
                if (File.Exists(tempThumbnailPath))
                    File.Delete(tempThumbnailPath);
            }
        }

        return null;
    }



    private static FileDto MapToDto(DriveFile file, Guid? currentUserId = null)
    {
        var isFavorite = currentUserId.HasValue && file.IsFavoritedBy(currentUserId.Value);

        return new FileDto
        {
            Id = file.Id,
            Name = file.Name,
            Description = file.Description,
            ContentType = file.ContentType.Value,
            Size = file.Size,
            Hash = file.Hash,
            OwnerId = file.OwnerId,
            OwnerName = $"{file.Owner.FirstName} {file.Owner.LastName}",
            CreatedAt = file.CreatedAt,
            UpdatedAt = file.UpdatedAt,
            Visibility = file.Visibility.ToString(),
            VersionCount = file.Versions.Count,
            Tags = file.Tags.Select(t => t.Tag.Name).ToList(),
            IsFavorite = isFavorite
        };
    }
}