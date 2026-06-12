package com.lifeos.document.service;

import com.lifeos.document.domain.DocumentCategory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Deterministic, keyword-based document classifier. Inspects the file name and
 * extracted text to assign a {@link DocumentCategory}. Rules are ordered by
 * specificity; the first category whose keywords match wins.
 *
 * <p>This is a real, explainable baseline that works offline. It can be layered
 * with an LLM-based classifier later without changing callers.
 */
@Component
public class DocumentClassifier {

    private record Rule(DocumentCategory category, List<String> keywords) {
    }

    // Ordered most-specific first.
    private static final List<Rule> RULES = List.of(
            new Rule(DocumentCategory.INSURANCE,
                    List.of("insurance", "policy number", "premium", "insured", "coverage", "policyholder")),
            new Rule(DocumentCategory.TAX,
                    List.of("tax", "income tax", "irs", "vat", "gst", "form 16", "w-2", "1099", "tax return")),
            new Rule(DocumentCategory.BANK_STATEMENT,
                    List.of("bank statement", "account balance", "ifsc", "iban", "available balance", "transaction history")),
            new Rule(DocumentCategory.MEDICAL,
                    List.of("prescription", "diagnosis", "patient", "doctor", "hospital", "lab report", "medical")),
            new Rule(DocumentCategory.CERTIFICATE,
                    List.of("certificate", "certify", "this is to certify", "awarded", "completion")),
            new Rule(DocumentCategory.ID_DOCUMENT,
                    List.of("passport", "driving licence", "driver license", "national id", "aadhaar", "identity card")),
            new Rule(DocumentCategory.CONTRACT,
                    List.of("agreement", "contract", "terms and conditions", "hereby agree", "party of the first part")),
            new Rule(DocumentCategory.EDUCATION,
                    List.of("transcript", "marksheet", "grade", "semester", "university", "syllabus", "degree")),
            new Rule(DocumentCategory.RECEIPT,
                    List.of("receipt", "amount paid", "thank you for your purchase", "subtotal", "cash tendered")),
            new Rule(DocumentCategory.BILL,
                    List.of("invoice", "bill", "amount due", "due date", "electricity", "utility", "billing period"))
    );

    public DocumentCategory classify(String fileName, String extractedText) {
        String haystack = ((fileName == null ? "" : fileName) + "\n"
                + (extractedText == null ? "" : extractedText)).toLowerCase(Locale.ROOT);

        DocumentCategory best = DocumentCategory.OTHER;
        int bestScore = 0;
        for (Rule rule : RULES) {
            int score = 0;
            for (String kw : rule.keywords()) {
                if (haystack.contains(kw)) {
                    score++;
                }
            }
            // Earlier (more specific) rules win ties because we only replace on strictly higher score.
            if (score > bestScore) {
                bestScore = score;
                best = rule.category();
            }
        }
        return best;
    }

    public Map<DocumentCategory, List<String>> rules() {
        return RULES.stream().collect(java.util.stream.Collectors.toMap(Rule::category, Rule::keywords));
    }
}
