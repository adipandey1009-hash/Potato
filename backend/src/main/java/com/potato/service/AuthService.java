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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "An account with this email already exists");
        }

        User user = new User(
            req.fullName().trim(),
            normalizedEmail,
            passwordEncoder.encode(req.password()),
            Role.CUSTOMER
        );
        User savedUser = userRepository.save(user);

        return createAuthResponse(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(normalizedEmail)
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account is deactivated. Please contact support.");
        }

        return createAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest req) {
        String tokenHash = jwtTokenProvider.hashToken(req.refreshToken());
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token"));

        if (!token.isValid()) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        User user = token.getUser();
        if (user.isDeleted() || !user.isActive()) {
            throw new UnauthorizedException("User account is inactive");
        }

        // Token rotation: revoke old token
        token.setRevokedAt(Instant.now());
        refreshTokenRepository.save(token);

        // Issue new token pair
        return createAuthResponse(user);
    }

    @Transactional
    public void logout(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            refreshTokenRepository.revokeAllByUser(user, Instant.now());
        }
    }

    @Transactional(readOnly = true)
    public UserDto getMe(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedException("User not found"));
        return UserDto.fromEntity(user);
    }

    private AuthResponse createAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String rawRefreshToken = jwtTokenProvider.generateRawRefreshToken();
        String tokenHash = jwtTokenProvider.hashToken(rawRefreshToken);
        Instant expiry = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiry);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, rawRefreshToken, UserDto.fromEntity(user));
    }
}
