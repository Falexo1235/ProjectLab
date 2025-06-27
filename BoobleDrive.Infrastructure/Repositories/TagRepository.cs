using BoobleDrive.Domain.Repositories;
using BoobleDrive.Infrastructure.Data;

namespace BoobleDrive.Infrastructure.Repositories;

public class TagRepository : ITagRepository
{
    private readonly BoobleDriveDbContext _context;

    public TagRepository(BoobleDriveDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames, CancellationToken cancellationToken = default)
    {
        if (tagNames == null)
        {
            throw new ArgumentNullException(nameof(tagNames));
        }

        var normalized = tagNames.Select(n => n.Trim())
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.ToLowerInvariant())
            .Distinct()
            .ToList();

        if (normalized.Count == 0)
        {
            return Array.Empty<Tag>();
        }

        var existing = await _context.Tags
            .Where(t => normalized.Contains(t.Name.ToLower()))
            .ToListAsync(cancellationToken);

        var existingNames = existing.Select(t => t.Name.ToLower()).ToHashSet();

        var toCreate = normalized.Except(existingNames)
            .Select(n => new Tag(n))
            .ToList();

        if (toCreate.Count > 0)
        {
            await _context.Tags.AddRangeAsync(toCreate, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return existing.Concat(toCreate).ToList();
    }
}