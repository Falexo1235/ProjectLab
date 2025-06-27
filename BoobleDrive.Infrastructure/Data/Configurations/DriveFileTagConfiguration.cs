namespace BoobleDrive.Infrastructure.Data.Configurations;

public class DriveFileTagConfiguration : IEntityTypeConfiguration<DriveFileTag>
{
    public void Configure(EntityTypeBuilder<DriveFileTag> builder)
    {
        builder.ToTable("DriveFileTags");

        builder.HasKey(dft => new { dft.DriveFileId, dft.TagId });

        builder.HasOne(dft => dft.File)
            .WithMany(df => df.Tags)
            .HasForeignKey(dft => dft.DriveFileId);

        builder.HasOne(dft => dft.Tag)
            .WithMany()
            .HasForeignKey(dft => dft.TagId);
    }
}