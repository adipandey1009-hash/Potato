package com.potato.service;

import com.potato.dto.AuthDtos.*;
import com.potato.entity.RefreshToken;
import com.potato.entity.Role;
import com.potato.entity.User;
import com.potato.exception.ConflictException;
import com.potato.exception.UnauthorizedException;
import com.potato.repository.RefreshTokenRepository;
import com.potato.repository.UserRepository;
import com.potato.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtTokenProvider);
    }

    @Test
    @DisplayName("register() successfully hashes password and returns tokens")
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest("Test User", "test@example.com", "SecurePassword123!");

        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode(req.password())).thenReturn("$2a$12$hashedPassword");
        when(jwtTokenProvider.generateAccessToken(any(), eq("test@example.com"), eq("CUSTOMER"))).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRawRefreshToken()).thenReturn("mock-raw-refresh");
        when(jwtTokenProvider.hashToken("mock-raw-refresh")).thenReturn("mock-hash");
        when(jwtTokenProvider.getRefreshTokenExpirationMs()).thenReturn(604800000L);

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        AuthResponse res = authService.register(req);

        assertThat(res.accessToken()).isEqualTo("mock-access-token");
        assertThat(res.refreshToken()).isEqualTo("mock-raw-refresh");
        assertThat(res.user().email()).isEqualTo("test@example.com");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("register() with existing email throws ConflictException")
    void testRegisterDuplicateEmail() {
        RegisterRequest req = new RegisterRequest("Dup User", "dup@example.com", "Password123!");
        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("login() with correct credentials returns tokens")
    void testLoginSuccess() {
        LoginRequest req = new LoginRequest("user@example.com", "ValidPassword123!");
        User user = new User("User", "user@example.com", "$2a$12$hash", Role.CUSTOMER);
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ValidPassword123!", "$2a$12$hash")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(any(), eq("user@example.com"), eq("CUSTOMER"))).thenReturn("access-token");
        when(jwtTokenProvider.generateRawRefreshToken()).thenReturn("refresh-token");
        when(jwtTokenProvider.hashToken("refresh-token")).thenReturn("hash");

        AuthResponse res = authService.login(req);

        assertThat(res.accessToken()).isEqualTo("access-token");
        assertThat(res.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    @DisplayName("login() with wrong password throws generic UnauthorizedException")
    void testLoginWrongPassword() {
        LoginRequest req = new LoginRequest("user@example.com", "WrongPassword!");
        User user = new User("User", "user@example.com", "$2a$12$hash", Role.CUSTOMER);

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword!", "$2a$12$hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login() with non-existent user throws generic UnauthorizedException")
    void testLoginUserNotFound() {
        LoginRequest req = new LoginRequest("notfound@example.com", "AnyPassword!");
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("notfound@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("refreshToken() rotates token by revoking old and issuing new")
    void testRefreshTokenRotation() {
        RefreshTokenRequest req = new RefreshTokenRequest("raw-refresh-token");
        User user = new User("User", "user@example.com", "hash", Role.CUSTOMER);
        user.setId(UUID.randomUUID());

        RefreshToken oldToken = new RefreshToken(user, "old-hash", Instant.now().plusSeconds(3600));

        when(jwtTokenProvider.hashToken("raw-refresh-token")).thenReturn("old-hash");
        when(refreshTokenRepository.findByTokenHash("old-hash")).thenReturn(Optional.of(oldToken));
        when(jwtTokenProvider.generateAccessToken(any(), any(), any())).thenReturn("new-access");
        when(jwtTokenProvider.generateRawRefreshToken()).thenReturn("new-raw-refresh");
        when(jwtTokenProvider.hashToken("new-raw-refresh")).thenReturn("new-hash");

        AuthResponse res = authService.refreshToken(req);

        assertThat(oldToken.isRevoked()).isTrue();
        assertThat(res.accessToken()).isEqualTo("new-access");
        assertThat(res.refreshToken()).isEqualTo("new-raw-refresh");
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }
}
