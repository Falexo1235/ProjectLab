using BoobleDrive.Domain.Enums;
using BoobleDrive.Domain.Repositories;
using BoobleDrive.Infrastructure.Data;

namespace BoobleDrive.Infrastructure.Repositories;

public class FileRepository : IFileRepository
{
    private readonly BoobleDriveDbContext _context;

    public FileRepository(BoobleDriveDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<DriveFile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<DriveFile?> GetByIdWithTagsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<DriveFile?> GetByIdWithVersionsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Versions)
            .Include(f => f.Shares)
            .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<DriveFile?> GetByIdWithPublicLinksAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Include(f => f.PublicLinks)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetByOwnerIdAsync(Guid ownerId, bool includeDeleted = false, List<string>? tagNames = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .Where(f => f.OwnerId == ownerId);

        if (!includeDeleted)
        {
            query = query.Where(f => f.DeletedAt == null);
        }

        if (tagNames != null && tagNames.Any())
        {
            var lowered = tagNames.Select(t => t.ToLower()).ToList();
            query = query.Where(f => lowered.All(tag => f.Tags.Any(t => t.Tag.Name.ToLower() == tag)));
        }

        return await query.OrderByDescending(f => f.UpdatedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetByOwnerIdAsync(Guid ownerId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        return await GetByOwnerIdAsync(ownerId, includeDeleted, null, cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetSharedWithUserAsync(Guid userId, List<string>? tagNames, CancellationToken cancellationToken = default)
    {
        var query = _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Shares)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .Where(f => f.DeletedAt == null && f.Shares.Any(s => s.UserId == userId && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow)));

        if (tagNames != null && tagNames.Any())
        {
            var lowered = tagNames.Select(t => t.ToLower()).ToList();
            query = query.Where(f => lowered.All(tag => f.Tags.Any(t => t.Tag.Name.ToLower() == tag)));
        }

        return await query.OrderByDescending(f => f.UpdatedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetSharedWithUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await GetSharedWithUserAsync(userId, null, cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetPublicFilesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Where(f => f.DeletedAt == null && f.Visibility == FileVisibility.Public)
            .OrderByDescending(f => f.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> SearchAsync(string searchTerm, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        return await SearchAsync(searchTerm, userId, null, cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> SearchAsync(string? searchTerm, Guid? userId, List<string>? tagNames, CancellationToken cancellationToken = default)
    {
        var query = _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .Where(f => f.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowered = searchTerm.ToLower();
            query = query.Where(f => f.Name.ToLower().Contains(lowered) || (f.Description != null && f.Description.ToLower().Contains(lowered)));
        }

        if (tagNames != null && tagNames.Any())
        {
            var loweredTags = tagNames.Select(t => t.ToLower()).ToList();
            query = query.Where(f => loweredTags.All(tag => f.Tags.Any(t => t.Tag.Name.ToLower() == tag)));
        }

        if (userId.HasValue)
        {
            query = query.Where(f => f.OwnerId == userId.Value || f.Visibility == FileVisibility.Public ||
                f.Shares.Any(s => s.UserId == userId.Value && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow)));
        }
        else
        {
            query = query.Where(f => f.Visibility == FileVisibility.Public);
        }

        return await query.OrderByDescending(f => f.UpdatedAt).ToListAsync(cancellationToken);
    }

    public async Task<DriveFile> AddAsync(DriveFile file, CancellationToken cancellationToken = default)
    {
        var entry = await _context.Files.AddAsync(file, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entry.Entity;
    }

    public async Task UpdateAsync(DriveFile file, CancellationToken cancellationToken = default)
    {
        _context.Files.Update(file);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(DriveFile file, CancellationToken cancellationToken = default)
    {
        _context.Files.Remove(file);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsByHashAsync(string hash, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .AnyAsync(f => f.Hash == hash && f.DeletedAt == null, cancellationToken);
    }

    public async Task<bool> CanUserAccessAsync(Guid fileId, Guid userId, FilePermission permission, CancellationToken cancellationToken = default)
    {
        var file = await _context.Files
            .Include(f => f.Shares)
            .FirstOrDefaultAsync(f => f.Id == fileId, cancellationToken);

        if (file == null || file.DeletedAt.HasValue)
        {
            return false;
        }

        return file.CanAccess(userId, permission);
    }

    public async Task<long> GetTotalSizeByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Where(f => f.OwnerId == ownerId && f.DeletedAt == null)
            .SumAsync(f => f.Size, cancellationToken);
    }

    public async Task<IReadOnlyList<DriveFile>> GetFavoritesByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .Where(f => f.DeletedAt == null && f.FavoritedBy.Contains(userId))
            .Where(f => f.OwnerId == userId || f.Visibility == FileVisibility.Public ||
                f.Shares.Any(s => s.UserId == userId && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow)))
            .OrderByDescending(f => f.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<DriveFile?> GetByPublicTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _context.Files
            .Include(f => f.Owner)
            .Include(f => f.Tags).ThenInclude(t => t.Tag)
            .Include(f => f.PublicLinks)
            .Include(f => f.Versions)
            .Where(f => f.DeletedAt == null && f.PublicLinks.Any(pl => pl.Token == token && pl.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }
}