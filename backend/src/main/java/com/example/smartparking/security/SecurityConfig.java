package com.example.smartparking.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.smartparking.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration using session-based authentication with BCrypt.
 * <p>
 * Session-based auth is simpler for the MVP monolith and avoids JWT complexity.
 * CSRF is disabled since the frontend is a separate SPA using CORS.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    public SecurityConfig(CustomUserDetailsService userDetailsService, ObjectMapper objectMapper) {
        this.userDetailsService = userDetailsService;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {}) // Use WebConfig CORS settings
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/search/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/parking/lots/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/parking/lots/public/*/slots").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/parking/lots/public/*/availability").permitAll()
                // Actuator health
                .requestMatchers("/actuator/health").permitAll()
                // Swagger/OpenAPI
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                // WebSocket endpoint
                .requestMatchers("/ws/**").permitAll()
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(),
                            ApiResponse.error("Authentication required"));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(),
                            ApiResponse.error("Access denied"));
                })
            )
            .userDetailsService(userDetailsService);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
