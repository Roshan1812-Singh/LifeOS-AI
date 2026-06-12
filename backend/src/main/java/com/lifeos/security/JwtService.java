package com.lifeos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates stateless JWT access tokens. Refresh tokens are handled
 * separately (opaque, persisted, revocable) in {@code RefreshTokenService}.
 */
@Service
public class JwtService {

    private static final String CLAIM_ROLE = "role";

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;

    public JwtService(SecurityProperties properties) {
        this.signingKey = Keys.hmacShaKeyFor(
                properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = properties.jwt().accessTokenExpirationMs();
    }

    public String generateAccessToken(AppUserDetails principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getPublicId().toString())
                .claim("email", principal.getUsername())
                .claim(CLAIM_ROLE, principal.getUser().getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * @return the subject (user public id) if the token is valid, otherwise null.
     */
    public String extractSubject(String token) {
        try {
            return parse(token).getSubject();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
