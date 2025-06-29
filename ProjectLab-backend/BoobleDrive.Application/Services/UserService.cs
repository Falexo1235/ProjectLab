using System.Security.Cryptography;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Domain.Entities;
using BoobleDrive.Domain.Repositories;
using BoobleDrive.Domain.Services;
using BoobleDrive.Domain.ValueObjects;

namespace BoobleDrive.Application.Services;

public class UserService
{
    private readonly IPasswordHashingService _passwordHashingService;
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository, IPasswordHashingService passwordHashingService)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _passwordHashingService = passwordHashingService ?? throw new ArgumentNullException(nameof(passwordHashingService));
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var emailVO = new Email(email);
        var user = await _userRepository.GetByEmailAsync(emailVO, cancellationToken);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto> CreateUserAsync(string email, string password, string firstName, string lastName, CancellationToken cancellationToken = default)
    {
        var emailVO = new Email(email);

        if (await _userRepository.ExistsByEmailAsync(emailVO, cancellationToken))
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        var hashedPassword = _passwordHashingService.HashPassword(password);
        var user = new User(emailVO, hashedPassword, firstName, lastName);

        await _userRepository.AddAsync(user, cancellationToken);
        return MapToDto(user);
    }

    public async Task<bool> ValidateUserCredentialsAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var emailVO = new Email(email);
        var user = await _userRepository.GetByEmailAsync(emailVO, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return false;
        }

        var isValid = _passwordHashingService.VerifyPassword(password, user.HashedPassword);

        if (isValid)
        {
            user.UpdateLastLogin();
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        return isValid;
    }

    public async Task DeactivateUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        user.Deactivate();
        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    [Obsolete("Use GenerateAndSaveRefreshTokenAsync or SaveRefreshTokenAsync overload with provided token", true)]
    public async Task<(string token, RefreshToken refreshToken)> SaveRefreshTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        var refreshToken = GenerateRefreshToken();
        user.AddRefreshToken(refreshToken);

        await _userRepository.UpdateAsync(user, cancellationToken);

        return (refreshToken.Token, refreshToken);
    }

    public async Task SaveRefreshTokenAsync(Guid userId, string token, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        var refreshToken = new RefreshToken
        {
            Token = token,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };

        user.AddRefreshToken(refreshToken);
        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    public async Task<UserDto> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetUserByRefreshTokenAsync(refreshToken, cancellationToken);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var token = user.RefreshTokens.Single(x => x.Token == refreshToken);
        if (!token.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token is inactive.");
        }

        token.Revoked = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user, cancellationToken);

        return MapToDto(user);
    }

    public async Task RevokeAllRefreshTokensAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        foreach (var token in user.RefreshTokens.Where(t => t.IsActive))
        {
            token.Revoked = DateTime.UtcNow;
        }

        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    private RefreshToken GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomNumber),
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email.Value,
            FirstName = user.FirstName,
            LastName = user.LastName,
            TotalStorageUsed = user.TotalStorageUsed,
            StorageQuota = user.StorageQuota,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            IsActive = user.IsActive
        };
    }
}