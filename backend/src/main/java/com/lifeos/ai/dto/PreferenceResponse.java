package com.lifeos.ai.dto;

import com.lifeos.ai.domain.UserPreference;

public record PreferenceResponse(String key, String value) {

    public static PreferenceResponse from(UserPreference p) {
        return new PreferenceResponse(p.getKey(), p.getValue());
    }
}
