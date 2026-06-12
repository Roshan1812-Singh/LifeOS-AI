package com.lifeos.document;

import com.lifeos.document.domain.DocumentCategory;
import com.lifeos.document.service.DocumentClassifier;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentClassifierTest {

    private final DocumentClassifier classifier = new DocumentClassifier();

    @Test
    void classifiesInsurance() {
        String text = "This insurance policy has a premium. The insured coverage applies. Policyholder: Jane.";
        assertThat(classifier.classify("policy.pdf", text)).isEqualTo(DocumentCategory.INSURANCE);
    }

    @Test
    void classifiesBillFromInvoiceKeywords() {
        String text = "Invoice. Amount due by the due date for your electricity utility billing period.";
        assertThat(classifier.classify("eb.pdf", text)).isEqualTo(DocumentCategory.BILL);
    }

    @Test
    void classifiesTax() {
        String text = "Income tax return. Form 16 issued. GST details enclosed.";
        assertThat(classifier.classify("tax.pdf", text)).isEqualTo(DocumentCategory.TAX);
    }

    @Test
    void unknownContentIsOther() {
        assertThat(classifier.classify("notes.txt", "random musings about my weekend"))
                .isEqualTo(DocumentCategory.OTHER);
    }
}
