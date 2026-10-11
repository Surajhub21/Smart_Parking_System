package com.example.smartparking.user;

import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user profile management.
 * <p>
 * Allows authenticated users to view and update their own profile.
 * Users can update their name, phone, and change their password.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Get the authenticated user's full profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        return ResponseEntity.ok(ApiResponse.success(UserProfileResponse.fromUser(user)));
    }

    /**
     * Update the authenticated user's profile (name, phone).
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", UserProfileResponse.fromUser(saved)));
    }

    /**
     * Change the authenticated user's password.
     */
    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    // ---- Request/Response DTOs ----

    public static class UpdateProfileRequest {
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        private String phone;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    /**
     * User profile response DTO — never exposes password.
     */
    public record UserProfileResponse(
            String id,
            String email,
            String name,
            String phone,
            java.util.Set<String> roles,
            boolean active,
            java.time.Instant createdAt
    ) {
        public static UserProfileResponse fromUser(User user) {
            java.util.Set<String> roleNames = user.getRoles().stream()
                    .map(Role::name)
                    .collect(java.util.stream.Collectors.toSet());
            return new UserProfileResponse(
                    user.getId(), user.getEmail(), user.getName(), user.getPhone(),
                    roleNames, user.isActive(), user.getCreatedAt()
            );
        }
    }
}
