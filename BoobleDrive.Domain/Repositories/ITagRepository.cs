using BoobleDrive.Domain.Entities;

namespace BoobleDrive.Domain.Repositories;

public interface ITagRepository
{
    /// <summary>
    ///     Retrieves existing tags matching the provided names or creates them if they don't exist.
    ///     Returns the resulting collection of Tag entities.
    ///     The operation is case-insensitive.
    /// </summary>
    Task<IReadOnlyList<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames, CancellationToken cancellationToken = default);
    
    /// <summary>
    ///     Retrieves all tags in the system.
    /// </summary>
    Task<IReadOnlyList<Tag>> GetAllTagsAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    ///     Searches for tags by name pattern for autocomplete functionality.
    /// </summary>
    Task<IReadOnlyList<Tag>> SearchTagsAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default);
}