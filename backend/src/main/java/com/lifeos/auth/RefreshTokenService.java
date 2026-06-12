package com.lifeos.auth;

import com.lifeos.common.exception.ApiException;
import com.lifeos.security.SecurityProperties;
import com.lifeos.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Manages opaque refresh tokens. The raw token is returned to the client once;
 * only its hash is persisted, and tokens can be revoked (logout / rotation).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final long refreshTokenExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository, SecurityProperties properties) {
        this.repository = repository;
        this.refreshTokenExpirationMs = properties.jwt().refreshTokenExpirationMs();
    }

    /**
     * Issues a new refresh token for the user and returns the raw value.
     */
    @Transactional
    public String issue(User user) {
        String rawToken = generateRawToken();
        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);
        repository.save(new RefreshToken(user, hash(rawToken), expiresAt));
        return rawToken;
    }

    /**
     * Validates and rotates a refresh token: the old token is revoked and a new
     * one is issued. Returns the user the token belongs to and the new raw token.
     */
    @Transactional
    public Rotation rotate(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (!stored.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }
        stored.revoke();
        User user = stored.getUser();
        String newRaw = issue(user);
        return new Rotation(user, newRaw);
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHash(hash(rawToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public void revokeAll(User user) {
        repository.revokeAllForUser(user);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[64];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public record Rotation(User user, String rawToken) {
    }
}
