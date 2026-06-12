package com.lifeos.document.repository;

import com.lifeos.document.domain.Document;
import com.lifeos.document.domain.DocumentCategory;
import com.lifeos.document.domain.DocumentStatus;
import com.lifeos.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    Optional<Document> findByPublicIdAndUser(UUID publicId, User user);

    List<Document> findByUserOrderByCreatedAtDesc(User user);

    List<Document> findByUserAndCategoryOrderByCreatedAtDesc(User user, DocumentCategory category);

    /**
     * Lexical search across title, original filename and extracted text. Used both
     * for the search UI and as the retrieval step for document Q&A.
     */
    @Query("""
            SELECT d FROM Document d
            WHERE d.user = :user
              AND d.status = :status
              AND (LOWER(d.title) LIKE LOWER(CONCAT('%', :term, '%'))
                   OR LOWER(d.originalName) LIKE LOWER(CONCAT('%', :term, '%'))
                   OR LOWER(COALESCE(d.extractedText, '')) LIKE LOWER(CONCAT('%', :term, '%')))
            ORDER BY d.createdAt DESC
            """)
    List<Document> search(@Param("user") User user,
                          @Param("status") DocumentStatus status,
                          @Param("term") String term,
                          Pageable pageable);
}
