namespace BoobleDrive.Domain.ValueObjects;

public class MimeType : IEquatable<MimeType>
{
    private MimeType()
    {
    }

    public MimeType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("MIME type cannot be empty", nameof(value));
        }

        value = value.ToLowerInvariant().Trim();

        if (!value.Contains('/'))
        {
            throw new ArgumentException("Invalid MIME type format", nameof(value));
        }

        Value = value;
    }

    public string Value { get; }
    public string Category => Value.Split('/')[0];
    public string SubType => Value.Split('/')[1];

    public bool IsImage => Category == "image";
    public bool IsDocument => Category == "application" || Category == "text";
    public bool IsMedia => Category == "audio" || Category == "video";

    public bool Equals(MimeType? other)
    {
        return other != null && Value == other.Value;
    }

    public static implicit operator string(MimeType mimeType)
    {
        return mimeType.Value;
    }

    public static implicit operator MimeType(string value)
    {
        return new MimeType(value);
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as MimeType);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public override string ToString()
    {
        return Value;
    }

    public static bool operator ==(MimeType? left, MimeType? right)
    {
        return ReferenceEquals(left, right) || (left?.Equals(right) ?? false);
    }

    public static bool operator !=(MimeType? left, MimeType? right)
    {
        return !(left == right);
    }
}