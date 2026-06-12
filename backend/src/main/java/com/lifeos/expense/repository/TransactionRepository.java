package com.lifeos.expense.repository;

import com.lifeos.expense.domain.ExpenseCategory;
import com.lifeos.expense.domain.ExpenseType;
import com.lifeos.expense.domain.Transaction;
import com.lifeos.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByPublicIdAndUser(UUID publicId, User user);

    List<Transaction> findByUserAndOccurredOnBetweenOrderByOccurredOnDesc(
            User user, LocalDate from, LocalDate to);

    /**
     * Filtered listing for the transactions view. All filters are optional.
     */
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.user = :user
              AND (:type IS NULL OR t.type = :type)
              AND (:category IS NULL OR t.category = :category)
              AND (:from IS NULL OR t.occurredOn >= :from)
              AND (:to IS NULL OR t.occurredOn <= :to)
            ORDER BY t.occurredOn DESC, t.id DESC
            """)
    List<Transaction> search(@Param("user") User user,
                             @Param("type") ExpenseType type,
                             @Param("category") ExpenseCategory category,
                             @Param("from") LocalDate from,
                             @Param("to") LocalDate to);
}
