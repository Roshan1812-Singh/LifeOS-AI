package com.lifeos.document.service;

import com.lifeos.ai.llm.LlmClient;
import com.lifeos.ai.llm.LlmCompletion;
import com.lifeos.ai.llm.LlmException;
import com.lifeos.ai.llm.LlmMessage;
import com.lifeos.common.exception.ApiException;
import com.lifeos.document.domain.Document;
import com.lifeos.document.domain.DocumentStatus;
import com.lifeos.document.dto.AskResponse;
import com.lifeos.document.repository.DocumentRepository;
import com.lifeos.user.User;
import com.lifeos.user.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Answers natural-language questions over a user's documents using
 * retrieval-augmented generation with <em>lexical</em> retrieval (keyword
 * scoring). This works on any SQL database (no vector extension required) and
 * degrades honestly: if no documents are relevant it says so without inventing
 * an answer, and if no LLM is configured it returns a clear error.
 */
@Service
public class DocumentQaService {

    private static final int MAX_DOCS = 4;
    private static final int PER_DOC_CHARS = 3000;
    private static final Set<String> STOPWORDS = Set.of(
            "the", "and", "for", "are", "was", "what", "when", "where", "which", "who", "whom",
            "how", "does", "did", "is", "in", "on", "of", "to", "my", "me", "a", "an", "do",
            "find", "show", "tell", "about", "this", "that", "with", "have", "has");

    private final DocumentRepository documentRepository;
    private final LlmClient llmClient;
    private final UserService userService;

    public DocumentQaService(DocumentRepository documentRepository, LlmClient llmClient,
                             UserService userService) {
        this.documentRepository = documentRepository;
        this.llmClient = llmClient;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public AskResponse ask(User user, String question) {
        User managed = userService.reference(user);
        List<Document> relevant = retrieve(managed, question);

        if (relevant.isEmpty()) {
            return new AskResponse(
                    "I couldn't find any documents related to your question. Try uploading the "
                            + "relevant file or rephrasing.",
                    List.of());
        }

        if (!llmClient.isAvailable()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI is not configured. Set the AI provider API key (e.g. OPENAI_API_KEY) to "
                            + "answer questions about your documents.");
        }

        String answer = generateAnswer(question, relevant);
        return new AskResponse(answer, relevant.stream().map(AskResponse.Source::from).toList());
    }

    private List<Document> retrieve(User user, String question) {
        Map<Long, Integer> scores = new LinkedHashMap<>();
        Map<Long, Document> byId = new LinkedHashMap<>();

        for (String keyword : keywords(question)) {
            for (Document doc : documentRepository.search(user, DocumentStatus.READY, keyword,
                    PageRequest.of(0, 25))) {
                scores.merge(doc.getId(), 1, Integer::sum);
                byId.putIfAbsent(doc.getId(), doc);
            }
        }

        return scores.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(MAX_DOCS)
                .map(e -> byId.get(e.getKey()))
                .toList();
    }

    private String generateAnswer(String question, List<Document> docs) {
        StringBuilder context = new StringBuilder();
        int i = 1;
        for (Document doc : docs) {
            String text = doc.getExtractedText() == null ? "" : doc.getExtractedText();
            if (text.length() > PER_DOC_CHARS) {
                text = text.substring(0, PER_DOC_CHARS);
            }
            context.append("[Document ").append(i++).append(": ").append(doc.getTitle())
                    .append(" | category: ").append(doc.getCategory()).append("]\n")
                    .append(text).append("\n\n");
        }

        List<LlmMessage> prompt = new ArrayList<>();
        prompt.add(LlmMessage.system("""
                You are LifeOS AI's document assistant. Answer the user's question using ONLY the \
                provided documents. Be concise and specific (include dates, amounts and names when \
                present). Mention which document the answer came from. If the answer is not in the \
                documents, say you could not find it."""));
        prompt.add(LlmMessage.user("Documents:\n" + context + "\nQuestion: " + question));

        try {
            LlmCompletion completion = llmClient.complete(prompt);
            return completion.content();
        } catch (LlmException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The AI provider could not be reached. Please try again.");
        }
    }

    private List<String> keywords(String question) {
        return Arrays.stream(question.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .filter(token -> token.length() > 2 && !STOPWORDS.contains(token))
                .distinct()
                .toList();
    }
}
