package com.lifeos.document.service;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

/**
 * Extracts plain text from uploaded files using Apache Tika, which transparently
 * handles PDF, Word, plain text, HTML and (when Tesseract is installed) images.
 */
@Service
public class TextExtractionService {

    private static final Logger log = LoggerFactory.getLogger(TextExtractionService.class);
    private static final int MAX_CHARS = 200_000;

    private final Tika tika;

    public TextExtractionService() {
        this.tika = new Tika();
        this.tika.setMaxStringLength(MAX_CHARS);
    }

    /**
     * @return extracted text (possibly empty), never null.
     * @throws TextExtractionException if the file cannot be parsed.
     */
    public String extract(InputStream input) {
        try {
            String text = tika.parseToString(input);
            return text == null ? "" : text.strip();
        } catch (IOException | TikaException e) {
            log.warn("Text extraction failed", e);
            throw new TextExtractionException("Could not extract text from the document", e);
        }
    }

    public static class TextExtractionException extends RuntimeException {
        public TextExtractionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
