using FileShare = BoobleDrive.Domain.Entities.FileShare;

namespace BoobleDrive.Infrastructure.Data.Configurations;

public class FileShareConfiguration : IEntityTypeConfiguration<FileShare>
{
    public void Configure(EntityTypeBuilder<FileShare> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.FileId)
            .IsRequired();

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.Property(s => s.Permission)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .IsRequired();

        builder.Property(s => s.ExpiresAt);

        builder.HasIndex(s => new { s.FileId, s.UserId })
            .IsUnique();

        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.ExpiresAt);

        builder.HasOne(s => s.File)
            .WithMany(f => f.Shares)
            .HasForeignKey(s => s.FileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.Ignore(s => s.IsExpired);

        builder.ToTable("FileShares");
    }
}