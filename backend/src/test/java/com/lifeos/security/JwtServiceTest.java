package com.lifeos.security;

import com.lifeos.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private AppUserDetails principal;

    @BeforeEach
    void setUp() {
        SecurityProperties properties = new SecurityProperties(
                new SecurityProperties.Jwt(
                        "unit-test-secret-unit-test-secret-unit-test-secret-1234",
                        900_000L,
                        1_209_600_000L),
                new SecurityProperties.Cors(List.of("http://localhost:5173")));
        jwtService = new JwtService(properties);
        User user = User.createLocal("Dave", "dave@example.com", null, "hash");
        principal = new AppUserDetails(user);
    }

    @Test
    void generatedTokenIsValidAndCarriesSubject() {
        String token = jwtService.generateAccessToken(principal);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractSubject(token))
                .isEqualTo(principal.getPublicId().toString());
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtService.generateAccessToken(principal);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.isValid(tampered)).isFalse();
        assertThat(jwtService.extractSubject(tampered)).isNull();
    }
}
