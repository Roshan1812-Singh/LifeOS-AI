package com.lifeos.user;

import com.lifeos.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.util.UUID;

/**
 * Application user. The numeric {@code id} is internal; {@code publicId} is the
 * stable identifier exposed to clients so internal keys are never leaked.
 */
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role = Role.USER;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 32)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    protected User() {
        // for JPA
    }

    public static User createLocal(String name, String email, String phone, String passwordHash) {
        User u = new User();
        u.publicId = UUID.randomUUID();
        u.name = name;
        u.email = email;
        u.phone = phone;
        u.passwordHash = passwordHash;
        u.role = Role.USER;
        u.enabled = true;
        u.emailVerified = false;
        u.authProvider = AuthProvider.LOCAL;
        return u;
    }

    public UUID getPublicId() {
        return publicId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }
}
