package com.lifeos.ai.service;

import com.lifeos.ai.domain.UserPreference;
import com.lifeos.ai.repository.UserPreferenceRepository;
import com.lifeos.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages the user's long-term memory (durable preferences/facts) that the
 * assistant injects into context on every conversation.
 */
@Service
public class PreferenceService {

    private final UserPreferenceRepository repository;

    public PreferenceService(UserPreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<UserPreference> list(User user) {
        return repository.findByUser(user);
    }

    @Transactional
    public UserPreference upsert(User user, String key, String value) {
        return repository.findByUserAndKey(user, key)
                .map(existing -> {
                    existing.setValue(value);
                    return existing;
                })
                .orElseGet(() -> repository.save(new UserPreference(user, key, value)));
    }

    @Transactional
    public void delete(User user, String key) {
        repository.findByUserAndKey(user, key).ifPresent(repository::delete);
    }

    /**
     * Renders preferences as a compact block for the LLM system prompt.
     * Returns an empty string when the user has no stored preferences.
     */
    @Transactional(readOnly = true)
    public String asContextBlock(User user) {
        List<UserPreference> prefs = repository.findByUser(user);
        if (prefs.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("Known preferences about the user:\n");
        for (UserPreference p : prefs) {
            sb.append("- ").append(p.getKey()).append(": ").append(p.getValue()).append('\n');
        }
        return sb.toString();
    }
}
