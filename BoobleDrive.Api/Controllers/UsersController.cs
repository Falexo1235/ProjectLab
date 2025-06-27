using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BoobleDrive.Api.Services;
using BoobleDrive.Application.DTOs;
using BoobleDrive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoobleDrive.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;
    private readonly TokenService _tokenService;
    private readonly UserService _userService;

    public UsersController(UserService userService, TokenService tokenService, ILogger<UsersController> logger)
    {
        _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        return await GetUser(Guid.Parse(userId), cancellationToken);
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserDto>> GetUser(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> RegisterUser(
        [FromBody] RegisterUserRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.CreateUserAsync(
                request.Email,
                request.Password,
                request.FirstName,
                request.LastName,
                cancellationToken);

            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _userService.SaveRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

            return Ok(new LoginResponse { Success = true, Token = accessToken, RefreshToken = refreshToken, User = user });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid user registration operation");
            return Conflict(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid user registration arguments");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isValid = await _userService.ValidateUserCredentialsAsync(
                request.Email,
                request.Password,
                cancellationToken);

            if (!isValid)
            {
                return Unauthorized("Invalid credentials");
            }

            var user = await _userService.GetUserByEmailAsync(request.Email, cancellationToken);
            var accessToken = _tokenService.GenerateAccessToken(user!);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _userService.SaveRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

            return Ok(new LoginResponse
            {
                Success = true,
                Token = accessToken,
                RefreshToken = refreshToken,
                User = user!
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid login arguments");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<LoginResponse>> RefreshToken(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.RefreshTokenAsync(request.RefreshToken, cancellationToken);
            var newAccessToken = _tokenService.GenerateAccessToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            await _userService.SaveRefreshTokenAsync(user.Id, newRefreshToken, cancellationToken);

            return Ok(new LoginResponse
            {
                Success = true,
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                User = user
            });
        }
        catch (Exception ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        await _userService.RevokeAllRefreshTokensAsync(Guid.Parse(userId), cancellationToken);
        return Ok("Logged out successfully");
    }

    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeactivateCurrentUser(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        return await DeactivateUser(Guid.Parse(userId), cancellationToken);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeactivateUser(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _userService.DeactivateUserAsync(userId, cancellationToken);
            return Ok("User deactivated successfully");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class RegisterUserRequest
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;

    [Required] [MinLength(8)] public string Password { get; set; } = string.Empty;

    [Required] public string FirstName { get; set; } = string.Empty;

    [Required] public string LastName { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;

    [Required] public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto? User { get; set; }
}

public class RefreshTokenRequest
{
    [Required] public string Token { get; set; }

    [Required] public string RefreshToken { get; set; }
}