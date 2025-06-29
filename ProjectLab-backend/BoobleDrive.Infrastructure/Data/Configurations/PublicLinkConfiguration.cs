namespace BoobleDrive.Infrastructure.Data.Configurations;

public class PublicLinkConfiguration : IEntityTypeConfiguration<PublicLink>
{
    public void Configure(EntityTypeBuilder<PublicLink> builder)
    {
        builder.ToTable("PublicLinks");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Token).IsRequired();
        builder.HasIndex(l => l.Token).IsUnique();

        builder.HasOne(l => l.File)
            .WithMany(f => f.PublicLinks)
            .HasForeignKey(l => l.FileId);
    }
}