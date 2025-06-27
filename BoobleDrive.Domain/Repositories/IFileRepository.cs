using BoobleDrive.Domain.Entities;
using BoobleDrive.Domain.Enums;

namespace BoobleDrive.Domain.Repositories;

public interface IFileRepository
{
    Task<DriveFile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriveFile?> GetByIdWithTagsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriveFile?> GetByIdWithVersionsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriveFile?> GetByIdWithPublicLinksAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetByOwnerIdAsync(Guid ownerId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetByOwnerIdAsync(Guid ownerId, bool includeDeleted, List<string>? tagNames, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetSharedWithUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetSharedWithUserAsync(Guid userId, List<string>? tagNames, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetPublicFilesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> SearchAsync(string searchTerm, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> SearchAsync(string? searchTerm, Guid? userId, List<string>? tagNames, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DriveFile>> GetFavoritesByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DriveFile> AddAsync(DriveFile file, CancellationToken cancellationToken = default);
    Task UpdateAsync(DriveFile file, CancellationToken cancellationToken = default);
    Task DeleteAsync(DriveFile file, CancellationToken cancellationToken = default);
    Task<bool> ExistsByHashAsync(string hash, CancellationToken cancellationToken = default);
    Task<bool> CanUserAccessAsync(Guid fileId, Guid userId, FilePermission permission, CancellationToken cancellationToken = default);
    Task<long> GetTotalSizeByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default);
}