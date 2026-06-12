package com.lifeos.user;

import com.lifeos.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getByPublicId(UUID publicId) {
        return userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Returns a managed reference (lazy proxy) for the given (possibly detached)
     * user, suitable for setting foreign keys without re-loading the row.
     */
    public User reference(User user) {
        return userRepository.getReferenceById(user.getId());
    }
}
