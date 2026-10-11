package com.example.smartparking.auth;

import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.security.UserPrincipal;
import com.example.smartparking.user.Role;
import com.example.smartparking.user.User;
import com.example.smartparking.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Authentication controller for registration, login, logout, and profile retrieval.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Register a new user with DRIVER or OWNER role.
     * Admin accounts are not created via public registration.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists");
        }

        // Only DRIVER and OWNER can self-register
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Must be DRIVER or OWNER");
        }
        if (role == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created via registration");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName().trim());
        user.setPhone(request.getPhone());
        user.setRoles(Set.of(role));
        user.setActive(true);

        User saved = userRepository.save(user);

        Set<String> roleNames = saved.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());

        AuthResponse response = new AuthResponse(
                saved.getId(), saved.getName(), saved.getEmail(), roleNames,
                "Registration successful");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    /**
     * Login with email and password. Creates an HTTP session.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Create session
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Set<String> roleNames = principal.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());

        AuthResponse response = new AuthResponse(
                principal.getId(), principal.getName(), principal.getUsername(), roleNames,
                "Login successful");

        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    /**
     * Logout and invalidate session.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    /**
     * Get current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        Set<String> roleNames = principal.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());

        AuthResponse response = new AuthResponse(
                principal.getId(), principal.getName(), principal.getUsername(), roleNames, null);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
