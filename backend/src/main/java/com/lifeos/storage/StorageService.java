package com.lifeos.storage;

import org.springframework.core.io.Resource;

import java.io.InputStream;

/**
 * Abstraction over binary object storage. Implementations may be backed by the
 * local filesystem, S3, or any compatible store. Callers never depend on the
 * concrete backend.
 */
public interface StorageService {

    /**
     * Persists a stream under a logical namespace (e.g. a user's id) and returns
     * the resulting storage key plus basic metadata.
     *
     * @param namespace   grouping prefix (must be safe; typically a UUID)
     * @param originalName original file name (used to preserve the extension)
     * @param contentType declared MIME type, may be null
     * @param data        the bytes to store
     */
    StoredObject store(String namespace, String originalName, String contentType, InputStream data);

    /**
     * Loads a previously stored object as a readable resource.
     */
    Resource load(String key);

    /**
     * Deletes the object if it exists. Never throws if the object is absent.
     */
    void delete(String key);
}
