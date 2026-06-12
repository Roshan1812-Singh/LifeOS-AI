package com.lifeos.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Storage configuration bound from {@code lifeos.storage.*}.
 *
 * <p>{@code provider} selects the implementation: {@code local} (default) writes
 * to the local filesystem; {@code s3} is reserved for an S3-compatible backend
 * that can be added without changing callers (they depend only on
 * {@link StorageService}).
 */
@ConfigurationProperties(prefix = "lifeos.storage")
public record StorageProperties(String provider, Local local, S3 s3) {

    public StorageProperties {
        if (provider == null || provider.isBlank()) {
            provider = "local";
        }
        if (local == null) {
            local = new Local("./data/uploads");
        }
    }

    public record Local(String baseDir) {
        public Local {
            if (baseDir == null || baseDir.isBlank()) {
                baseDir = "./data/uploads";
            }
        }
    }

    public record S3(String endpoint, String region, String bucket, String accessKey,
                     String secretKey) {
    }
}
