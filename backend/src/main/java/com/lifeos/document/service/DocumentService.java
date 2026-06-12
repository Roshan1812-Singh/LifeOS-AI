package com.lifeos.document.service;

import com.lifeos.common.exception.BadRequestException;
import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.document.domain.Document;
import com.lifeos.document.domain.DocumentCategory;
import com.lifeos.document.domain.DocumentStatus;
import com.lifeos.document.repository.DocumentRepository;
import com.lifeos.storage.StorageService;
import com.lifeos.storage.StoredObject;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final TextExtractionService textExtractionService;
    private final DocumentClassifier classifier;
    private final UserService userService;

    public DocumentService(DocumentRepository documentRepository,
                           StorageService storageService,
                           TextExtractionService textExtractionService,
                           DocumentClassifier classifier,
                           UserService userService) {
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.textExtractionService = textExtractionService;
        this.classifier = classifier;
        this.userService = userService;
    }

    @Transactional
    public Document upload(User user, MultipartFile file, String title) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file provided");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file");
        }

        User managed = userService.reference(user);
        String originalName = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename() : "upload";
        String docTitle = StringUtils.hasText(title) ? title.trim() : originalName;

        StoredObject stored = storageService.store(
                user.getPublicId().toString(), originalName, file.getContentType(),
                new ByteArrayInputStream(bytes));

        Document document = new Document(managed, docTitle, originalName, stored.key(),
                file.getContentType(), stored.sizeBytes());
        documentRepository.save(document);

        try {
            String text = textExtractionService.extract(new ByteArrayInputStream(bytes));
            DocumentCategory category = classifier.classify(originalName, text);
            document.markReady(text, category);
        } catch (RuntimeException e) {
            log.warn("Processing failed for document {}", document.getPublicId(), e);
            document.markFailed(e.getMessage());
        }
        return document;
    }

    @Transactional(readOnly = true)
    public List<Document> list(User user, DocumentCategory category) {
        User managed = userService.reference(user);
        return category != null
                ? documentRepository.findByUserAndCategoryOrderByCreatedAtDesc(managed, category)
                : documentRepository.findByUserOrderByCreatedAtDesc(managed);
    }

    @Transactional(readOnly = true)
    public Document get(User user, UUID documentId) {
        return require(user, documentId);
    }

    @Transactional(readOnly = true)
    public List<Document> search(User user, String term) {
        if (!StringUtils.hasText(term)) {
            return List.of();
        }
        return documentRepository.search(userService.reference(user), DocumentStatus.READY,
                term.trim(), PageRequest.of(0, 50));
    }

    @Transactional(readOnly = true)
    public DownloadableDocument download(User user, UUID documentId) {
        Document document = require(user, documentId);
        Resource resource = storageService.load(document.getStorageKey());
        return new DownloadableDocument(document, resource);
    }

    @Transactional
    public void delete(User user, UUID documentId) {
        Document document = require(user, documentId);
        String key = document.getStorageKey();
        documentRepository.delete(document);
        storageService.delete(key);
    }

    @Transactional(readOnly = true)
    public Document require(User user, UUID documentId) {
        return documentRepository.findByPublicIdAndUser(documentId, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }

    public record DownloadableDocument(Document document, Resource resource) {
    }
}
