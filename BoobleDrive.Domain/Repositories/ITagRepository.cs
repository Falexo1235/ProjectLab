using BoobleDrive.Domain.Entities;

namespace BoobleDrive.Domain.Repositories;

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames, CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Tag>> GetAllTagsAsync(CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Tag>> SearchTagsAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default);
}