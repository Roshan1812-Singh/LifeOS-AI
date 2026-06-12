package com.lifeos.user;

/**
 * Identifies how the user authenticates. LOCAL uses email/password; GOOGLE is
 * reserved for OAuth2 sign-in (wired in a later phase).
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
