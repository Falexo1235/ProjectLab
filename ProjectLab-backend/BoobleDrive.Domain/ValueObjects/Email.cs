using System.Text.RegularExpressions;

namespace BoobleDrive.Domain.ValueObjects;

public class Email : IEquatable<Email>
{
    private static readonly Regex EmailRegex = new Regex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private Email()
    {
    }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Email cannot be empty", nameof(value));
        }

        if (value.Length > 320)
        {
            throw new ArgumentException("Email is too long", nameof(value));
        }

        if (!EmailRegex.IsMatch(value))
        {
            throw new ArgumentException("Invalid email format", nameof(value));
        }

        Value = value.ToLowerInvariant();
    }

    public string Value { get; }

    public bool Equals(Email? other)
    {
        return other != null && Value == other.Value;
    }

    public static implicit operator string(Email email)
    {
        return email.Value;
    }

    public static implicit operator Email(string value)
    {
        return new Email(value);
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as Email);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public override string ToString()
    {
        return Value;
    }

    public static bool operator ==(Email? left, Email? right)
    {
        return ReferenceEquals(left, right) || (left?.Equals(right) ?? false);
    }

    public static bool operator !=(Email? left, Email? right)
    {
        return !(left == right);
    }
}