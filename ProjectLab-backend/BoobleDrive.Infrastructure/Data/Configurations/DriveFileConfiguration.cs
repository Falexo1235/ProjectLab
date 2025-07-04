using BoobleDrive.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace BoobleDrive.Infrastructure.Data.Configurations;

public class DriveFileConfiguration : IEntityTypeConfiguration<DriveFile>
{
    public void Configure(EntityTypeBuilder<DriveFile> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(f => f.Description)
            .HasMaxLength(1000);

        builder.Property(f => f.ContentType)
            .HasConversion(
                mimeType => mimeType.Value,
                value => new MimeType(value))
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(f => f.Size)
            .IsRequired();

        builder.Property(f => f.Hash)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(f => f.OwnerId)
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        builder.Property(f => f.UpdatedAt)
            .IsRequired();

        builder.Property(f => f.DeletedAt);

        builder.Property(f => f.Visibility)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(f => f.FavoritedBy)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new List<Guid>())
            .Metadata.SetValueComparer(new ValueComparer<IReadOnlyList<Guid>>(
                (c1, c2) => c1!.SequenceEqual(c2!),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList()));

        builder.HasIndex(f => f.Hash);
        builder.HasIndex(f => f.OwnerId);
        builder.HasIndex(f => f.CreatedAt);
        builder.HasIndex(f => f.Name);

        builder.HasOne(f => f.Owner)
            .WithMany(u => u.Files)
            .HasForeignKey(f => f.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(f => f.Versions)
            .WithOne(v => v.File)
            .HasForeignKey(v => v.FileId);

        builder.HasMany(f => f.Tags)
            .WithOne(t => t.File)
            .HasForeignKey(t => t.DriveFileId);

        builder.HasMany(f => f.Shares)
            .WithOne(s => s.File)
            .HasForeignKey(s => s.FileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(f => f.IsDeleted);
        builder.Ignore(f => f.CurrentVersion);

        builder.ToTable("Files");
    }
}