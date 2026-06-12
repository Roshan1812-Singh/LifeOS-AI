package com.lifeos.document.web;

import com.lifeos.document.domain.DocumentCategory;
import com.lifeos.document.dto.AskRequest;
import com.lifeos.document.dto.AskResponse;
import com.lifeos.document.dto.DocumentDetailResponse;
import com.lifeos.document.dto.DocumentResponse;
import com.lifeos.document.service.DocumentQaService;
import com.lifeos.document.service.DocumentService;
import com.lifeos.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@Tag(name = "Documents", description = "Upload, store, classify and query documents")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentQaService documentQaService;

    public DocumentController(DocumentService documentService, DocumentQaService documentQaService) {
        this.documentService = documentService;
        this.documentQaService = documentQaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document (PDF, image, Word, etc.); text is extracted and classified")
    public ResponseEntity<DocumentResponse> upload(
            @AuthenticationPrincipal AppUserDetails principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title) {
        DocumentResponse body = DocumentResponse.from(
                documentService.upload(principal.getUser(), file, title));
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping
    @Operation(summary = "List documents, optionally filtered by category")
    public List<DocumentResponse> list(@AuthenticationPrincipal AppUserDetails principal,
                                       @RequestParam(required = false) DocumentCategory category) {
        return documentService.list(principal.getUser(), category).stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @GetMapping("/search")
    @Operation(summary = "Lexical search across document title, name and extracted text")
    public List<DocumentResponse> search(@AuthenticationPrincipal AppUserDetails principal,
                                         @RequestParam("q") String q) {
        return documentService.search(principal.getUser(), q).stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @GetMapping("/{documentId}")
    @Operation(summary = "Get a document's metadata and a text preview")
    public DocumentDetailResponse get(@AuthenticationPrincipal AppUserDetails principal,
                                      @PathVariable UUID documentId) {
        return DocumentDetailResponse.from(documentService.get(principal.getUser(), documentId));
    }

    @GetMapping("/{documentId}/download")
    @Operation(summary = "Download the original file")
    public ResponseEntity<Resource> download(@AuthenticationPrincipal AppUserDetails principal,
                                             @PathVariable UUID documentId) {
        DocumentService.DownloadableDocument dl =
                documentService.download(principal.getUser(), documentId);
        String contentType = dl.document().getContentType() != null
                ? dl.document().getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dl.document().getOriginalName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(dl.resource());
    }

    @PostMapping("/ask")
    @Operation(summary = "Ask a question answered from your documents (RAG)")
    public AskResponse ask(@AuthenticationPrincipal AppUserDetails principal,
                           @Valid @RequestBody AskRequest request) {
        return documentQaService.ask(principal.getUser(), request.question());
    }

    @DeleteMapping("/{documentId}")
    @Operation(summary = "Delete a document and its stored file")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AppUserDetails principal,
                                       @PathVariable UUID documentId) {
        documentService.delete(principal.getUser(), documentId);
        return ResponseEntity.noContent().build();
    }
}
