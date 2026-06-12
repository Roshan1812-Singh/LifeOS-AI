package com.lifeos.expense.service;

import com.lifeos.common.exception.ResourceNotFoundException;
import com.lifeos.expense.domain.ExpenseCategory;
import com.lifeos.expense.domain.ExpenseType;
import com.lifeos.expense.domain.Transaction;
import com.lifeos.expense.dto.CategoryBreakdown;
import com.lifeos.expense.dto.MonthlyPoint;
import com.lifeos.expense.dto.SummaryResponse;
import com.lifeos.expense.dto.TransactionRequest;
import com.lifeos.expense.repository.TransactionRepository;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ExpenseService {

    private final TransactionRepository transactionRepository;
    private final UserService userService;

    public ExpenseService(TransactionRepository transactionRepository, UserService userService) {
        this.transactionRepository = transactionRepository;
        this.userService = userService;
    }

    @Transactional
    public Transaction create(User user, TransactionRequest request) {
        Transaction tx = new Transaction(userService.reference(user), request.type(),
                request.amount(), request.category(), request.occurredOn());
        tx.setNote(request.note());
        tx.setCurrency(StringUtils.hasText(request.currency()) ? request.currency().toUpperCase() : "USD");
        return transactionRepository.save(tx);
    }

    @Transactional
    public Transaction update(User user, UUID id, TransactionRequest request) {
        Transaction tx = require(user, id);
        tx.setType(request.type());
        tx.setAmount(request.amount());
        tx.setCategory(request.category());
        tx.setOccurredOn(request.occurredOn());
        tx.setNote(request.note());
        tx.setCurrency(StringUtils.hasText(request.currency()) ? request.currency().toUpperCase() : "USD");
        return tx;
    }

    @Transactional
    public void delete(User user, UUID id) {
        transactionRepository.delete(require(user, id));
    }

    @Transactional(readOnly = true)
    public List<Transaction> list(User user, ExpenseType type, ExpenseCategory category,
                                  LocalDate from, LocalDate to) {
        return transactionRepository.search(userService.reference(user), type, category, from, to);
    }

    @Transactional(readOnly = true)
    public Transaction require(User user, UUID id) {
        return transactionRepository.findByPublicIdAndUser(id, userService.reference(user))
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    @Transactional(readOnly = true)
    public SummaryResponse summary(User user, LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1);
        LocalDate end = to != null ? to : LocalDate.now(ZoneOffset.UTC);

        List<Transaction> txs = transactionRepository
                .findByUserAndOccurredOnBetweenOrderByOccurredOnDesc(userService.reference(user), start, end);

        BigDecimal totalIncome = sum(txs, ExpenseType.INCOME);
        BigDecimal totalExpense = sum(txs, ExpenseType.EXPENSE);

        Map<ExpenseCategory, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Transaction t : txs) {
            if (t.getType() == ExpenseType.EXPENSE) {
                byCategory.merge(t.getCategory(), t.getAmount(), BigDecimal::add);
            }
        }

        List<CategoryBreakdown> breakdown = byCategory.entrySet().stream()
                .sorted(Map.Entry.<ExpenseCategory, BigDecimal>comparingByValue().reversed())
                .map(e -> new CategoryBreakdown(e.getKey(), scale(e.getValue()),
                        percentage(e.getValue(), totalExpense)))
                .toList();

        ExpenseCategory top = breakdown.isEmpty() ? null : breakdown.get(0).category();
        String currency = txs.isEmpty() ? "USD" : txs.get(0).getCurrency();

        return new SummaryResponse(start, end, currency, scale(totalIncome), scale(totalExpense),
                scale(totalIncome.subtract(totalExpense)), txs.size(), top, breakdown);
    }

    @Transactional(readOnly = true)
    public List<MonthlyPoint> monthly(User user, int months) {
        int window = Math.max(1, Math.min(months, 24));
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        YearMonth startMonth = currentMonth.minusMonths(window - 1L);
        LocalDate start = startMonth.atDay(1);
        LocalDate end = currentMonth.atEndOfMonth();

        List<Transaction> txs = transactionRepository
                .findByUserAndOccurredOnBetweenOrderByOccurredOnDesc(userService.reference(user), start, end);

        Map<YearMonth, BigDecimal[]> buckets = new LinkedHashMap<>();
        for (int i = 0; i < window; i++) {
            buckets.put(startMonth.plusMonths(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        for (Transaction t : txs) {
            YearMonth ym = YearMonth.from(t.getOccurredOn());
            BigDecimal[] slot = buckets.get(ym);
            if (slot == null) {
                continue;
            }
            if (t.getType() == ExpenseType.INCOME) {
                slot[0] = slot[0].add(t.getAmount());
            } else {
                slot[1] = slot[1].add(t.getAmount());
            }
        }

        List<MonthlyPoint> points = new ArrayList<>();
        buckets.forEach((ym, slot) -> points.add(new MonthlyPoint(
                ym.toString(), scale(slot[0]), scale(slot[1]), scale(slot[0].subtract(slot[1])))));
        return points;
    }

    private BigDecimal sum(List<Transaction> txs, ExpenseType type) {
        return txs.stream()
                .filter(t -> t.getType() == type)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double percentage(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) {
            return 0.0;
        }
        return part.divide(whole, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
