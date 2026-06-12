package com.lifeos.storage;

import com.lifeos.common.exception.ApiException;
import com.lifeos.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * {@link StorageService} that writes objects to the local filesystem under a
 * configured base directory. Active by default (the {@code local} provider).
 * Files are stored as {@code <baseDir>/<namespace>/<randomKey><ext>} with the
 * original extension preserved.
 */
@Service
@ConditionalOnProperty(name = "lifeos.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalDiskStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalDiskStorageService.class);
    private static final Pattern SAFE_SEGMENT = Pattern.compile("[^a-zA-Z0-9._-]");

    private final Path root;

    public LocalDiskStorageService(StorageProperties properties) {
        this.root = Paths.get(properties.local().baseDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(root);
            log.info("Local storage initialised at {}", root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create storage directory: " + root, e);
        }
    }

    @Override
    public StoredObject store(String namespace, String originalName, String contentType,
                              InputStream data) {
        String safeNamespace = sanitize(namespace);
        String extension = extensionOf(originalName);
        String key = safeNamespace + "/" + UUID.randomUUID() + extension;
        Path target = resolve(key);

        try {
            Files.createDirectories(target.getParent());
            long size = Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            return new StoredObject(key, size, contentType);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
    }

    @Override
    public Resource load(String key) {
        Path path = resolve(key);
        if (!Files.exists(path) || !Files.isReadable(path)) {
            throw new ResourceNotFoundException("File not found");
        }
        return new PathResource(path);
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            log.warn("Failed to delete stored object {}", key, e);
        }
    }

    /**
     * Resolves a key against the root, guarding against path traversal.
     */
    private Path resolve(String key) {
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid storage key");
        }
        return resolved;
    }

    private String sanitize(String segment) {
        String cleaned = SAFE_SEGMENT.matcher(segment == null ? "" : segment).replaceAll("_");
        return cleaned.isBlank() ? "default" : cleaned;
    }

    private String extensionOf(String originalName) {
        if (originalName == null) {
            return "";
        }
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) {
            return "";
        }
        String ext = originalName.substring(dot);
        return SAFE_SEGMENT.matcher(ext).replaceAll("").isBlank() ? "" : ext.toLowerCase();
    }
}
