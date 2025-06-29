namespace BoobleDrive.Application.DTOs;

public class PublicLinkDto
{
    public string Url { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
}