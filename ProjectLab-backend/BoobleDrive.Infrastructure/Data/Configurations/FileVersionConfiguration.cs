namespace BoobleDrive.Infrastructure.Data.Configurations;

public class FileVersionConfiguration : IEntityTypeConfiguration<FileVersion>
{
    public void Configure(EntityTypeBuilder<FileVersion> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.FileId)
            .IsRequired();

        builder.Property(v => v.VersionNumber)
            .IsRequired();

        builder.Property(v => v.Content)
            .IsRequired();

        builder.Property(v => v.Size)
            .IsRequired();

        builder.Property(v => v.Hash)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.HasIndex(v => new { v.FileId, v.VersionNumber })
            .IsUnique();

        builder.HasIndex(v => v.Hash);

        builder.HasOne(v => v.File)
            .WithMany(f => f.Versions)
            .HasForeignKey(v => v.FileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("FileVersions");
    }
}