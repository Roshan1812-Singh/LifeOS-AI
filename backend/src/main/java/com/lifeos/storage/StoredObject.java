package com.lifeos.storage;

/**
 * Metadata returned after persisting a file to storage.
 *
 * @param key         opaque storage key used to load/delete the object later
 * @param sizeBytes   number of bytes written
 * @param contentType detected/declared MIME type (may be null)
 */
public record StoredObject(String key, long sizeBytes, String contentType) {
}
