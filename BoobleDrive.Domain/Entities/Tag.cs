namespace BoobleDrive.Domain.Entities;

public class Tag
{
    private Tag()
    {
    }

    public Tag(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Tag name cannot be empty.", nameof(name));
        }

        Id = Guid.NewGuid();
        Name = name;
    }

    public Guid Id { get; }
    public string Name { get; private set; }
}