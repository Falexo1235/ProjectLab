namespace BoobleDrive.Domain.ValueObjects;

public class MimeType : IEquatable<MimeType>
{
    private static readonly HashSet<string> AllowedMimeTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "image/bmp", "image/tiff", "image/ico",


        "application/pdf", "text/plain", "text/html", "text/css", "text/javascript",
        "application/json", "application/xml", "text/xml", "text/csv",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",


        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
        "application/x-tar", "application/gzip",


        "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
        "video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm",


        "application/octet-stream"
    };

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

        if (!AllowedMimeTypes.Contains(value))
        {
            throw new ArgumentException($"MIME type '{value}' is not allowed", nameof(value));
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