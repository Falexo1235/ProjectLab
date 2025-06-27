namespace BoobleDrive.Domain.Entities;

public class DriveFileTag
{
    private DriveFileTag()
    {
    }

    public DriveFileTag(Guid driveFileId, Guid tagId)
    {
        DriveFileId = driveFileId;
        TagId = tagId;
    }

    public Guid DriveFileId { get; }
    public DriveFile File { get; } = null!;

    public Guid TagId { get; }
    public Tag Tag { get; } = null!;
}