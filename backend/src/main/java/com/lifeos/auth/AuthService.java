package com.lifeos.auth;

import com.lifeos.auth.dto.AuthResponse;
import com.lifeos.auth.dto.LoginRequest;
import com.lifeos.auth.dto.RegisterRequest;
import com.lifeos.common.exception.ConflictException;
import com.lifeos.security.AppUserDetails;
import com.lifeos.security.JwtService;
import com.lifeos.security.SecurityProperties;
import com.lifeos.user.User;
import com.lifeos.user.UserRepository;
import com.lifeos.user.dto.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final long accessTokenExpirationMs;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       SecurityProperties securityProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.accessTokenExpirationMs = securityProperties.jwt().accessTokenExpirationMs();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }
        String phone = StringUtils.hasText(request.phone()) ? request.phone().trim() : null;
        User user = User.createLocal(
                request.name().trim(),
                request.email().trim().toLowerCase(),
                phone,
                passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        AppUserDetails principal = (AppUserDetails) authentication.getPrincipal();
        return issueTokens(principal.getUser());
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(rawRefreshToken);
        User user = rotation.user();
        String accessToken = jwtService.generateAccessToken(new AppUserDetails(user));
        return AuthResponse.of(accessToken, rotation.rawToken(), accessTokenExpirationMs,
                UserResponse.from(user));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(new AppUserDetails(user));
        String refreshToken = refreshTokenService.issue(user);
        return AuthResponse.of(accessToken, refreshToken, accessTokenExpirationMs,
                UserResponse.from(user));
    }
}
