using BoobleDrive.Infrastructure.Data.Configurations;
using FileShare = BoobleDrive.Domain.Entities.FileShare;

namespace BoobleDrive.Infrastructure.Data;

public class BoobleDriveDbContext : DbContext
{
    public BoobleDriveDbContext(DbContextOptions<BoobleDriveDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<DriveFile> Files { get; set; } = null!;
    public DbSet<FileVersion> FileVersions { get; set; } = null!;
    public DbSet<FileShare> FileShares { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<DriveFileTag> DriveFileTags { get; set; } = null!;
    public DbSet<PublicLink> PublicLinks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new DriveFileConfiguration());
        modelBuilder.ApplyConfiguration(new FileVersionConfiguration());
        modelBuilder.ApplyConfiguration(new FileShareConfiguration());
        modelBuilder.ApplyConfiguration(new TagConfiguration());
        modelBuilder.ApplyConfiguration(new DriveFileTagConfiguration());
        modelBuilder.ApplyConfiguration(new PublicLinkConfiguration());
    }
}